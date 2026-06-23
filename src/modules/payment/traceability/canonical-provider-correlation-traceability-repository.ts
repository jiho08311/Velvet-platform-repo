import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type CanonicalProviderCorrelationTraceabilityInsert = Readonly<{
  providerLineageKey: string
  providerOrderingKey: string
  providerReconstructionKey: string
  paymentEventKey: string
  providerCorrelationKey: string
  paymentId: string
  provider: string
  providerReferenceId?: string | null
  providerOrderId?: string | null
  providerStatus?: string | null
  runtimeSurface: string
  orderingTimestamp: string
  orderingSource: string
  replayTimestampSource: string
  orderingConfidence: string
  reconstructionStatus: string
  reconstructionConfidence: string
  providerReferenceObserved: boolean
  providerOrderObserved: boolean
  providerStatusObserved: boolean
  confirmationTimestampObserved: boolean
  lineageMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
  reconstructionMetadata?: JsonRecord
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

export async function writeCanonicalProviderCorrelationTraceability(
  input: CanonicalProviderCorrelationTraceabilityInsert
): Promise<void> {
  const provenanceMetadata = {
    ...(input.provenanceMetadata ?? {}),
    brief: "Wave-010-FEL-BR-012",
    aggregateRoot: "canonical_provider_correlation.id",
    runtimeAuthoritative: true,
    providerAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    providerConfirmationAuthorityPreserved: true,
    paymentRuntimeAuthorityPreserved: true,
    replayMutationAllowed: false,
    replayOwnedExecutionAllowed: false,
    providerReplayMutationAllowed: false,
    reconciliationRepairAllowed: false,
    rollbackSafe: true,
    failOpen: true,
  }

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_provider_lineage").upsert(
      {
        provider_lineage_key: input.providerLineageKey,
        payment_id: input.paymentId,
        payment_event_key: input.paymentEventKey,
        provider_correlation_key: input.providerCorrelationKey,
        provider: input.provider,
        provider_reference_id: input.providerReferenceId ?? null,
        provider_order_id: input.providerOrderId ?? null,
        provider_status: input.providerStatus ?? null,
        runtime_surface: input.runtimeSurface,
        source_table: "payments",
        source_row_id: input.paymentId,
        lineage_status: "observed",
        lineage_metadata: input.lineageMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "provider_lineage_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_provider_ordering").upsert(
      {
        provider_ordering_key: input.providerOrderingKey,
        payment_id: input.paymentId,
        payment_event_key: input.paymentEventKey,
        provider_correlation_key: input.providerCorrelationKey,
        provider: input.provider,
        provider_reference_id: input.providerReferenceId ?? null,
        provider_order_id: input.providerOrderId ?? null,
        provider_sequence: 10,
        ordering_timestamp: input.orderingTimestamp,
        ordering_source: input.orderingSource,
        replay_timestamp_source: input.replayTimestampSource,
        ordering_confidence: input.orderingConfidence,
        ordering_metadata: input.orderingMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "provider_ordering_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_provider_reconstruction_metadata").upsert(
      {
        provider_reconstruction_key: input.providerReconstructionKey,
        payment_id: input.paymentId,
        payment_event_key: input.paymentEventKey,
        provider_correlation_key: input.providerCorrelationKey,
        provider_lineage_key: input.providerLineageKey,
        provider_ordering_key: input.providerOrderingKey,
        provider: input.provider,
        provider_reference_id: input.providerReferenceId ?? null,
        provider_order_id: input.providerOrderId ?? null,
        provider_status: input.providerStatus ?? null,
        reconstruction_status: input.reconstructionStatus,
        reconstruction_confidence: input.reconstructionConfidence,
        provider_reference_observed: input.providerReferenceObserved,
        provider_order_observed: input.providerOrderObserved,
        provider_status_observed: input.providerStatusObserved,
        confirmation_timestamp_observed: input.confirmationTimestampObserved,
        reconstruction_metadata: input.reconstructionMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "provider_reconstruction_key" }
    )
  )
}

export async function writeCanonicalProviderCorrelationTraceabilityNoThrow(
  input: CanonicalProviderCorrelationTraceabilityInsert
): Promise<void> {
  try {
    await writeCanonicalProviderCorrelationTraceability(input)
  } catch (error) {
    logger.warn({
      event: "payment.traceability.canonical_provider_correlation.write_failed",
      message: "Canonical provider correlation traceability write failed",
      error,
    })
  }
}
