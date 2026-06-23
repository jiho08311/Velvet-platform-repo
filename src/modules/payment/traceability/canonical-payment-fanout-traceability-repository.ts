import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type CanonicalPaymentFanoutTraceabilityInsert = Readonly<{
  sideEffectLineageKey: string
  fanoutEventKey: string
  fanoutOrderingKey: string
  paymentId: string
  paymentEventKey?: string | null
  sideEffectKind: string
  runtimeSurface: string
  fanoutStatus: string
  fanoutSequence: number
  expectedForPayment: boolean
  sideEffectTable?: string | null
  sideEffectRowId?: string | null
  sideEffectStatus: string
  occurredAt: string
  orderingTimestamp: string
  orderingSource: string
  replayTimestampSource: string
  orderingConfidence?: string
  lineageMetadata?: JsonRecord
  eventMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
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

export async function writeCanonicalPaymentFanoutTraceability(
  input: CanonicalPaymentFanoutTraceabilityInsert
): Promise<void> {
  const provenanceMetadata = {
    ...(input.provenanceMetadata ?? {}),
    brief: "Wave-010-FEL-BR-011",
    aggregateRoot: "canonical_payment_side_effect.id",
    runtimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    paymentConfirmationRuntimeAuthorityPreserved: true,
    subscriptionActivationRuntimeAuthorityPreserved: true,
    earningCreationRuntimeAuthorityPreserved: true,
    projectionFirstRoutingAllowed: false,
    replayOwnedExecutionAllowed: false,
    entitlementAuthorityPromotionAllowed: false,
    replayMutationAllowed: false,
    reconciliationRepairAllowed: false,
    rollbackSafe: true,
    failOpen: true,
  }

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_payment_fanout_events").upsert(
      {
        fanout_event_key: input.fanoutEventKey,
        payment_id: input.paymentId,
        payment_event_key: input.paymentEventKey ?? null,
        side_effect_kind: input.sideEffectKind,
        runtime_surface: input.runtimeSurface,
        fanout_status: input.fanoutStatus,
        fanout_sequence: input.fanoutSequence,
        expected_for_payment: input.expectedForPayment,
        event_metadata: {
          ...(input.eventMetadata ?? {}),
          sideEffectTable: input.sideEffectTable ?? null,
          sideEffectRowId: input.sideEffectRowId ?? null,
        },
        provenance_metadata: provenanceMetadata,
        occurred_at: input.occurredAt,
      },
      { onConflict: "fanout_event_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_payment_side_effect_lineage").upsert(
      {
        side_effect_lineage_key: input.sideEffectLineageKey,
        payment_id: input.paymentId,
        payment_event_key: input.paymentEventKey ?? null,
        fanout_event_key: input.fanoutEventKey,
        side_effect_kind: input.sideEffectKind,
        runtime_surface: input.runtimeSurface,
        source_table: "payments",
        source_row_id: input.paymentId,
        side_effect_table: input.sideEffectTable ?? null,
        side_effect_row_id: input.sideEffectRowId ?? null,
        side_effect_status: input.sideEffectStatus,
        lineage_metadata: input.lineageMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "side_effect_lineage_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_payment_fanout_ordering").upsert(
      {
        fanout_ordering_key: input.fanoutOrderingKey,
        payment_id: input.paymentId,
        payment_event_key: input.paymentEventKey ?? null,
        fanout_event_key: input.fanoutEventKey,
        side_effect_kind: input.sideEffectKind,
        runtime_surface: input.runtimeSurface,
        fanout_sequence: input.fanoutSequence,
        ordering_timestamp: input.orderingTimestamp,
        ordering_source: input.orderingSource,
        replay_timestamp_source: input.replayTimestampSource,
        ordering_confidence:
          input.orderingConfidence ?? "observed_runtime_fanout",
        ordering_metadata: {
          ...(input.orderingMetadata ?? {}),
          fanoutEventKey: input.fanoutEventKey,
          sideEffectLineageKey: input.sideEffectLineageKey,
        },
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "fanout_ordering_key" }
    )
  )
}

export async function writeCanonicalPaymentFanoutTraceabilityNoThrow(
  input: CanonicalPaymentFanoutTraceabilityInsert
): Promise<void> {
  try {
    await writeCanonicalPaymentFanoutTraceability(input)
  } catch (error) {
    logger.warn({
      event: "payment.traceability.canonical_fanout.write_failed",
      message: "Canonical payment fanout traceability write failed",
      error,
    })
  }
}
