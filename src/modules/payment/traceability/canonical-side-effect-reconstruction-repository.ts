import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type CanonicalSideEffectReconstructionInsert = Readonly<{
  sideEffectReconstructionKey: string
  paymentId: string
  paymentEventKey: string
  fanoutEventKey: string
  sideEffectLineageKey: string
  fanoutOrderingKey: string
  sideEffectKind: string
  runtimeSurface: string
  sideEffectTable?: string | null
  sideEffectRowId?: string | null
  fanoutSequence: number
  reconstructionStatus: string
  reconstructionConfidence: string
  lineageObserved: boolean
  fanoutEventObserved: boolean
  orderingObserved: boolean
  sideEffectRowObserved: boolean
  replaySafeReconstructable: boolean
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

export async function writeCanonicalSideEffectReconstruction(
  input: CanonicalSideEffectReconstructionInsert
): Promise<void> {
  const provenanceMetadata = {
    ...(input.provenanceMetadata ?? {}),
    brief: "Wave-010-FEL-BR-021",
    aggregateRoot: "canonical_payment_side_effect.id",
    runtimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    subscriptionAuthorityPreserved: true,
    earningAuthorityPreserved: true,
    notificationAuthorityPreserved: true,
    replayOwnedExecutionAllowed: false,
    replayMutationAllowed: false,
    reconciliationRepairAllowed: false,
    entitlementAuthorityPromotionAllowed: false,
    rollbackSafe: true,
    failOpen: true,
  }

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_side_effect_reconstruction_metadata").upsert(
      {
        side_effect_reconstruction_key: input.sideEffectReconstructionKey,
        payment_id: input.paymentId,
        payment_event_key: input.paymentEventKey,
        fanout_event_key: input.fanoutEventKey,
        side_effect_lineage_key: input.sideEffectLineageKey,
        fanout_ordering_key: input.fanoutOrderingKey,
        side_effect_kind: input.sideEffectKind,
        runtime_surface: input.runtimeSurface,
        source_table: "payments",
        source_row_id: input.paymentId,
        side_effect_table: input.sideEffectTable ?? null,
        side_effect_row_id: input.sideEffectRowId ?? null,
        fanout_sequence: input.fanoutSequence,
        reconstruction_surface: "payment.side_effect.reconstruction",
        reconstruction_status: input.reconstructionStatus,
        reconstruction_confidence: input.reconstructionConfidence,
        lineage_observed: input.lineageObserved,
        fanout_event_observed: input.fanoutEventObserved,
        ordering_observed: input.orderingObserved,
        side_effect_row_observed: input.sideEffectRowObserved,
        replay_safe_reconstructable: input.replaySafeReconstructable,
        runtime_side_effect_executed: true,
        replay_side_effect_executed: false,
        lineage_metadata: input.lineageMetadata ?? {},
        ordering_metadata: input.orderingMetadata ?? {},
        reconstruction_metadata: input.reconstructionMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "side_effect_reconstruction_key" }
    )
  )
}

export async function writeCanonicalSideEffectReconstructionNoThrow(
  input: CanonicalSideEffectReconstructionInsert
): Promise<void> {
  try {
    await writeCanonicalSideEffectReconstruction(input)
  } catch (error) {
    logger.warn({
      event: "payment.traceability.canonical_side_effect_reconstruction.write_failed",
      message: "Canonical side-effect reconstruction write failed",
      error,
    })
  }
}
