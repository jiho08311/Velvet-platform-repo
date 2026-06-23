import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type CanonicalEarningCreationProvenanceInsert = Readonly<{
  settlementEventKey: string
  earningLineageKey: string
  earningProvenanceKey: string
  earningReconstructionKey: string
  paymentId: string
  paymentEventKey?: string | null
  paymentFanoutEventKey?: string | null
  earningId: string
  creatorId: string
  sourceType: string
  earningStatus: string
  grossAmount: number
  feeRateBps: number
  feeAmount: number
  netAmount: number
  currency: string
  availableAt?: string | null
  earningCreatedAt?: string | null
  settledAt: string
  runtimeSurface: string
  settlementStatus: string
  reconstructionStatus: string
  reconstructionConfidence: string
  paymentObserved: boolean
  earningObserved: boolean
  amountObserved: boolean
  feeObserved: boolean
  availabilityObserved: boolean
  payoutEligibilityObserved: boolean
  settlementMetadata?: JsonRecord
  lineageMetadata?: JsonRecord
  earningMetadata?: JsonRecord
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

export async function writeCanonicalEarningCreationProvenance(
  input: CanonicalEarningCreationProvenanceInsert
): Promise<void> {
  const provenanceMetadata = {
    ...(input.provenanceMetadata ?? {}),
    brief: "Wave-010-FEL-BR-014",
    aggregateRoot: "canonical_settlement_event.id",
    runtimeAuthoritative: true,
    earningRuntimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    earningCreationRuntimeAuthorityPreserved: true,
    earningsMutableSettlementStatePreserved: true,
    immutableLedgerPromotionAllowed: false,
    settlementReplayRepairAllowed: false,
    payoutEligibilityReplacementAllowed: false,
    replayMutationAllowed: false,
    replayOwnedExecutionAllowed: false,
    reconciliationRepairAllowed: false,
    rollbackSafe: true,
    failOpen: true,
  }

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_settlement_events").upsert(
      {
        settlement_event_key: input.settlementEventKey,
        payment_id: input.paymentId,
        payment_event_key: input.paymentEventKey ?? null,
        payment_fanout_event_key: input.paymentFanoutEventKey ?? null,
        earning_id: input.earningId,
        creator_id: input.creatorId,
        source_type: input.sourceType,
        settlement_status: input.settlementStatus,
        runtime_surface: input.runtimeSurface,
        source_table: "payments",
        source_row_id: input.paymentId,
        earning_table: "earnings",
        earning_row_id: input.earningId,
        gross_amount: input.grossAmount,
        fee_rate_bps: input.feeRateBps,
        fee_amount: input.feeAmount,
        net_amount: input.netAmount,
        currency: input.currency,
        settlement_metadata: input.settlementMetadata ?? {},
        provenance_metadata: provenanceMetadata,
        settled_at: input.settledAt,
      },
      { onConflict: "settlement_event_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_earning_lineage").upsert(
      {
        earning_lineage_key: input.earningLineageKey,
        settlement_event_key: input.settlementEventKey,
        payment_id: input.paymentId,
        payment_event_key: input.paymentEventKey ?? null,
        payment_fanout_event_key: input.paymentFanoutEventKey ?? null,
        earning_id: input.earningId,
        creator_id: input.creatorId,
        source_type: input.sourceType,
        lineage_status: "observed",
        runtime_surface: input.runtimeSurface,
        source_table: "payments",
        source_row_id: input.paymentId,
        target_table: "earnings",
        target_row_id: input.earningId,
        lineage_metadata: input.lineageMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "earning_lineage_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_earning_provenance").upsert(
      {
        earning_provenance_key: input.earningProvenanceKey,
        settlement_event_key: input.settlementEventKey,
        earning_lineage_key: input.earningLineageKey,
        payment_id: input.paymentId,
        earning_id: input.earningId,
        creator_id: input.creatorId,
        source_type: input.sourceType,
        earning_status: input.earningStatus,
        gross_amount: input.grossAmount,
        fee_rate_bps: input.feeRateBps,
        fee_amount: input.feeAmount,
        net_amount: input.netAmount,
        currency: input.currency,
        available_at: input.availableAt ?? null,
        earning_created_at: input.earningCreatedAt ?? null,
        provenance_status: "observed",
        provenance_source: "runtime_earning_creation",
        runtime_surface: input.runtimeSurface,
        earning_metadata: input.earningMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "earning_provenance_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_earning_reconstruction_metadata").upsert(
      {
        earning_reconstruction_key: input.earningReconstructionKey,
        settlement_event_key: input.settlementEventKey,
        earning_lineage_key: input.earningLineageKey,
        earning_provenance_key: input.earningProvenanceKey,
        payment_id: input.paymentId,
        earning_id: input.earningId,
        creator_id: input.creatorId,
        source_type: input.sourceType,
        reconstruction_status: input.reconstructionStatus,
        reconstruction_confidence: input.reconstructionConfidence,
        payment_observed: input.paymentObserved,
        earning_observed: input.earningObserved,
        amount_observed: input.amountObserved,
        fee_observed: input.feeObserved,
        availability_observed: input.availabilityObserved,
        payout_eligibility_observed: input.payoutEligibilityObserved,
        reconstruction_metadata: input.reconstructionMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "earning_reconstruction_key" }
    )
  )
}

export async function writeCanonicalEarningCreationProvenanceNoThrow(
  input: CanonicalEarningCreationProvenanceInsert
): Promise<void> {
  try {
    await writeCanonicalEarningCreationProvenance(input)
  } catch (error) {
    logger.warn({
      event: "payout.traceability.canonical_earning_creation_provenance.write_failed",
      message: "Canonical earning creation provenance write failed",
      error,
    })
  }
}
