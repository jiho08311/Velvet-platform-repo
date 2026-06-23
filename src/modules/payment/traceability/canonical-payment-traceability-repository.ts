import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type CanonicalPaymentTraceabilityInsert = Readonly<{
  paymentEventKey: string
  providerCorrelationKey: string
  confirmationLineageKey: string
  paymentOrderingKey: string
  paymentId: string
  userId: string
  creatorId?: string | null
  paymentType: string
  paymentStatus: "succeeded"
  amount: number
  currency: string
  provider: string
  providerReferenceId?: string | null
  providerOrderId?: string | null
  providerStatus?: string | null
  targetType?: string | null
  targetId?: string | null
  confirmedAt: string
  sourceOperation: string
  sourceVersion: string
  replayTimestampSource: string
  correlationMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
}>

async function assertNoSupabaseError(
  operation: PromiseLike<{ error: unknown }>
): Promise<void> {
  const { error } = await operation

  if (error) {
    throw error
  }
}

export async function writeCanonicalPaymentTraceability(
  input: CanonicalPaymentTraceabilityInsert
): Promise<void> {
  const provenanceMetadata = {
    ...(input.provenanceMetadata ?? {}),
    brief: "Wave-010-FEL-BR-010",
    aggregateRoot: "canonical_payment_event.id",
    runtimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    paymentRuntimeAuthorityPreserved: true,
    providerConfirmationAuthorityPreserved: true,
    replayMutationAllowed: false,
    reconciliationRepairAllowed: false,
    rollbackSafe: true,
    failOpen: true,
  }
  const correlationMetadata = {
    ...(input.correlationMetadata ?? {}),
    providerReferenceObserved: input.providerReferenceId != null,
    providerOrderObserved: input.providerOrderId != null,
  }

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_payment_events").upsert(
      {
        payment_event_key: input.paymentEventKey,
        payment_id: input.paymentId,
        user_id: input.userId,
        creator_id: input.creatorId ?? null,
        payment_type: input.paymentType,
        payment_status: input.paymentStatus,
        amount: input.amount,
        currency: input.currency,
        provider: input.provider,
        target_type: input.targetType ?? null,
        target_id: input.targetId ?? null,
        event_kind: "payment_confirmed",
        event_surface: "payment_confirmation_service",
        event_metadata: {
          providerStatus: input.providerStatus ?? "succeeded",
          replayTimestampSource: input.replayTimestampSource,
        },
        provenance_metadata: provenanceMetadata,
        occurred_at: input.confirmedAt,
      },
      { onConflict: "payment_event_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_payment_provider_correlations").upsert(
      {
        provider_correlation_key: input.providerCorrelationKey,
        payment_id: input.paymentId,
        provider: input.provider,
        provider_reference_id: input.providerReferenceId ?? null,
        provider_order_id: input.providerOrderId ?? null,
        confirmation_amount: input.amount,
        provider_status: input.providerStatus ?? "succeeded",
        correlation_surface: "payment.provider.confirmation",
        correlation_status: "observed",
        correlation_metadata: correlationMetadata,
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "provider_correlation_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_payment_confirmation_lineage").upsert(
      {
        confirmation_lineage_key: input.confirmationLineageKey,
        payment_id: input.paymentId,
        payment_event_key: input.paymentEventKey,
        provider_correlation_key: input.providerCorrelationKey,
        source_table: "payments",
        source_row_id: input.paymentId,
        source_operation: input.sourceOperation,
        source_version: input.sourceVersion,
        lineage_surface: "payment.confirmation.lineage",
        lineage_status: "observed",
        lineage_metadata: {
          paymentStatus: input.paymentStatus,
          confirmedAt: input.confirmedAt,
        },
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "confirmation_lineage_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_payment_ordering").upsert(
      {
        payment_ordering_key: input.paymentOrderingKey,
        payment_id: input.paymentId,
        payment_event_key: input.paymentEventKey,
        ordering_surface: "payment.confirmation.replay_ordering",
        ordering_timestamp: input.confirmedAt,
        ordering_source: "payment_confirmation_service.confirmed_at",
        replay_timestamp_source: input.replayTimestampSource,
        ordering_confidence: "observed_runtime_confirmation",
        ordering_metadata: {
          paymentEventKey: input.paymentEventKey,
          providerCorrelationKey: input.providerCorrelationKey,
        },
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "payment_ordering_key" }
    )
  )
}

export async function writeCanonicalPaymentTraceabilityNoThrow(
  input: CanonicalPaymentTraceabilityInsert
): Promise<void> {
  try {
    await writeCanonicalPaymentTraceability(input)
  } catch (error) {
    logger.warn({
      event: "payment.traceability.canonical_payment.write_failed",
      message: "Canonical payment traceability write failed",
      error,
    })
  }
}
