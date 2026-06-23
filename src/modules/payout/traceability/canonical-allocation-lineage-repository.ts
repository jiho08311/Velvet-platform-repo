import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type CanonicalAllocationLineageInsert = Readonly<{
  allocationLineageKey: string
  allocationOrderingKey: string
  payoutEligibilityKey: string
  allocationReconstructionKey: string
  allocationStage: string
  settlementEventKey?: string | null
  earningLineageKey?: string | null
  settlementOrderingKey?: string | null
  paymentId?: string | null
  earningId?: string | null
  creatorId: string
  payoutRequestId?: string | null
  payoutId?: string | null
  sourceType?: string | null
  runtimeSurface: string
  allocationSource: string
  allocationStatus: string
  sourceTable: string
  sourceRowId?: string | null
  targetTable?: string | null
  targetRowId?: string | null
  orderingTimestamp: string
  orderingSource: string
  replayTimestampSource: string
  orderingConfidence: string
  requestedAmount?: number | null
  requestableAmount?: number | null
  currency?: string | null
  accountReadinessState?: "ready" | "missing" | null
  eligibilityState: string
  eligibilityObserved: boolean
  reconstructionStatus: string
  reconstructionConfidence: string
  earningObserved: boolean
  allocationObserved: boolean
  orderingObserved: boolean
  payoutEligibilityObserved: boolean
  replaySafeReconstructable: boolean
  lineageMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
  eligibilityMetadata?: JsonRecord
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

export async function writeCanonicalAllocationLineage(
  input: CanonicalAllocationLineageInsert
): Promise<void> {
  const provenanceMetadata = {
    ...(input.provenanceMetadata ?? {}),
    brief: "Wave-010-FEL-BR-023",
    aggregateRoot: "canonical_allocation_lineage.id",
    runtimeAuthoritative: true,
    earningAllocationRuntimeAuthoritative: true,
    payoutEligibilityRuntimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    runtimeAllocationAuthorityPreserved: true,
    payoutEligibilityRuntimeAuthorityPreserved: true,
    replayOwnedSettlementMutationAllowed: false,
    projectionBalanceAuthorityAllowed: false,
    immutableLedgerPromotionAllowed: false,
    payoutEligibilityReplacementAllowed: false,
    reconciliationRepairAllowed: false,
    rollbackSafe: true,
    failOpen: true,
  }

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_allocation_lineage").upsert(
      {
        allocation_lineage_key: input.allocationLineageKey,
        allocation_stage: input.allocationStage,
        settlement_event_key: input.settlementEventKey ?? null,
        earning_lineage_key: input.earningLineageKey ?? null,
        settlement_ordering_key: input.settlementOrderingKey ?? null,
        payout_eligibility_key: input.payoutEligibilityKey,
        payment_id: input.paymentId ?? null,
        earning_id: input.earningId ?? null,
        creator_id: input.creatorId,
        payout_request_id: input.payoutRequestId ?? null,
        payout_id: input.payoutId ?? null,
        source_type: input.sourceType ?? null,
        runtime_surface: input.runtimeSurface,
        allocation_source: input.allocationSource,
        allocation_status: input.allocationStatus,
        source_table: input.sourceTable,
        source_row_id: input.sourceRowId ?? null,
        target_table: input.targetTable ?? null,
        target_row_id: input.targetRowId ?? null,
        lineage_metadata: input.lineageMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "allocation_lineage_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_allocation_ordering").upsert(
      {
        allocation_ordering_key: input.allocationOrderingKey,
        allocation_lineage_key: input.allocationLineageKey,
        allocation_stage: input.allocationStage,
        payment_id: input.paymentId ?? null,
        earning_id: input.earningId ?? null,
        creator_id: input.creatorId,
        payout_request_id: input.payoutRequestId ?? null,
        payout_id: input.payoutId ?? null,
        source_type: input.sourceType ?? null,
        runtime_surface: input.runtimeSurface,
        ordering_timestamp: input.orderingTimestamp,
        ordering_source: input.orderingSource,
        replay_timestamp_source: input.replayTimestampSource,
        ordering_confidence: input.orderingConfidence,
        ordering_metadata: input.orderingMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "allocation_ordering_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_payout_eligibility_provenance").upsert(
      {
        payout_eligibility_key: input.payoutEligibilityKey,
        allocation_lineage_key: input.allocationLineageKey,
        allocation_ordering_key: input.allocationOrderingKey,
        creator_id: input.creatorId,
        payout_request_id: input.payoutRequestId ?? null,
        requested_amount: input.requestedAmount ?? null,
        requestable_amount: input.requestableAmount ?? null,
        currency: input.currency ?? null,
        account_readiness_state: input.accountReadinessState ?? null,
        eligibility_state: input.eligibilityState,
        eligibility_observed: input.eligibilityObserved,
        eligibility_metadata: input.eligibilityMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "payout_eligibility_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_allocation_reconstruction_metadata").upsert(
      {
        allocation_reconstruction_key: input.allocationReconstructionKey,
        allocation_lineage_key: input.allocationLineageKey,
        allocation_ordering_key: input.allocationOrderingKey,
        payout_eligibility_key: input.payoutEligibilityKey,
        allocation_stage: input.allocationStage,
        payment_id: input.paymentId ?? null,
        earning_id: input.earningId ?? null,
        creator_id: input.creatorId,
        payout_request_id: input.payoutRequestId ?? null,
        payout_id: input.payoutId ?? null,
        reconstruction_status: input.reconstructionStatus,
        reconstruction_confidence: input.reconstructionConfidence,
        earning_observed: input.earningObserved,
        allocation_observed: input.allocationObserved,
        ordering_observed: input.orderingObserved,
        payout_eligibility_observed: input.payoutEligibilityObserved,
        replay_safe_reconstructable: input.replaySafeReconstructable,
        reconstruction_metadata: input.reconstructionMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "allocation_reconstruction_key" }
    )
  )
}

export async function writeCanonicalAllocationLineageNoThrow(
  input: CanonicalAllocationLineageInsert
): Promise<void> {
  try {
    await writeCanonicalAllocationLineage(input)
  } catch (error) {
    logger.warn({
      event: "payout.traceability.canonical_allocation_lineage.write_failed",
      message: "Canonical allocation lineage write failed",
      error,
    })
  }
}
