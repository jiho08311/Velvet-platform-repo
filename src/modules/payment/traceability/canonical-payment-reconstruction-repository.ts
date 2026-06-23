import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type CanonicalPaymentReconstructionInsert = Readonly<{
  paymentReconstructionKey: string
  paymentId: string
  paymentEventKey: string
  providerCorrelationKey: string
  paymentOrderingKey: string
  providerReconstructionKey: string
  reconstructionStatus: string
  reconstructionConfidence: string
  paymentEventObserved: boolean
  providerCorrelationObserved: boolean
  paymentOrderingObserved: boolean
  providerReconstructionObserved: boolean
  replaySafeOrderingObserved: boolean
  providerReferenceObserved: boolean
  providerOrderObserved: boolean
  confirmationTimestampObserved: boolean
  reconstructionMetadata?: JsonRecord
  lineageMetadata?: JsonRecord
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

export async function writeCanonicalPaymentReconstruction(
  input: CanonicalPaymentReconstructionInsert
): Promise<void> {
  const provenanceMetadata = {
    ...(input.provenanceMetadata ?? {}),
    brief: "Wave-010-FEL-BR-020",
    aggregateRoot: "canonical_payment_event.id",
    runtimeAuthoritative: true,
    providerAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    ledgerAuthoritative: false,
    paymentRuntimeAuthorityPreserved: true,
    providerConfirmationAuthorityPreserved: true,
    replayMutationAllowed: false,
    replayOwnedExecutionAllowed: false,
    providerReplayMutationAllowed: false,
    reconciliationRepairAllowed: false,
    rollbackSafe: true,
    failOpen: true,
  }

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_payment_reconstruction_metadata").upsert(
      {
        payment_reconstruction_key: input.paymentReconstructionKey,
        payment_id: input.paymentId,
        payment_event_key: input.paymentEventKey,
        provider_correlation_key: input.providerCorrelationKey,
        payment_ordering_key: input.paymentOrderingKey,
        provider_reconstruction_key: input.providerReconstructionKey,
        source_table: "payments",
        source_row_id: input.paymentId,
        reconstruction_surface: "payment.event.reconstruction",
        reconstruction_status: input.reconstructionStatus,
        reconstruction_confidence: input.reconstructionConfidence,
        payment_event_observed: input.paymentEventObserved,
        provider_correlation_observed: input.providerCorrelationObserved,
        payment_ordering_observed: input.paymentOrderingObserved,
        provider_reconstruction_observed: input.providerReconstructionObserved,
        replay_safe_ordering_observed: input.replaySafeOrderingObserved,
        provider_reference_observed: input.providerReferenceObserved,
        provider_order_observed: input.providerOrderObserved,
        confirmation_timestamp_observed: input.confirmationTimestampObserved,
        reconstruction_metadata: input.reconstructionMetadata ?? {},
        lineage_metadata: input.lineageMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "payment_reconstruction_key" }
    )
  )
}

export async function writeCanonicalPaymentReconstructionNoThrow(
  input: CanonicalPaymentReconstructionInsert
): Promise<void> {
  try {
    await writeCanonicalPaymentReconstruction(input)
  } catch (error) {
    logger.warn({
      event: "payment.traceability.canonical_reconstruction.write_failed",
      message: "Canonical payment reconstruction write failed",
      error,
    })
  }
}
