import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type CanonicalPayoutEligibilityProvenanceInsert = Readonly<{
  payoutEligibilityKey: string
  payoutEligibilityLineageKey: string
  eligibilityOrderingKey: string
  settlementLinkageKey: string
  eligibilityReconstructionKey: string
  legacyPayoutEligibilityKey?: string | null
  allocationLineageKey?: string | null
  allocationOrderingKey?: string | null
  creatorId: string
  payoutRequestId?: string | null
  payoutId?: string | null
  earningIds: readonly string[]
  eligibilityState: string
  requestedAmount?: number | null
  requestableAmount?: number | null
  linkedAmount?: number | null
  currency?: string | null
  accountReadinessState?: "ready" | "missing" | null
  requestableEarningCount: number
  lockedEarningCount: number
  orderingTimestamp: string
  orderingSource: string
  replayTimestampSource: string
  orderingConfidence: string
  reconstructionConfidence: string
  eligibilityObserved: boolean
  earningsSnapshotObserved: boolean
  settlementLinkageObserved: boolean
  replaySafeOrderingObserved: boolean
  replaySafeReconstructable: boolean
  decisionMetadata?: JsonRecord
  lineageMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
  linkageMetadata?: JsonRecord
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

export async function writeCanonicalPayoutEligibilityProvenance(
  input: CanonicalPayoutEligibilityProvenanceInsert
): Promise<void> {
  const provenanceMetadata = {
    ...(input.provenanceMetadata ?? {}),
    brief: "Wave-010-FEL-BR-025",
    aggregateRoot: "canonical_payout_eligibility.id",
    runtimeAuthoritative: true,
    earningsAuthoritative: true,
    payoutEligibilityRuntimeAuthoritative: true,
    settlementRuntimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    synchronizedCandidateOnly: true,
    advisoryOnly: true,
    runtimeEligibilityAuthorityPreserved: true,
    earningsMutableSettlementAuthorityPreserved: true,
    settlementRuntimeAuthorityPreserved: true,
    immutableLedgerPromotionAllowed: false,
    payoutAuthorityTransferAllowed: false,
    payoutEligibilityReplacementAllowed: false,
    replayMutationAllowed: false,
    replayOwnedExecutionAllowed: false,
    projectionBalanceAuthorityAllowed: false,
    reconciliationRepairAllowed: false,
    rollbackSafe: true,
    failOpen: true,
  }

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_payout_eligibility").upsert(
      {
        payout_eligibility_key: input.payoutEligibilityKey,
        legacy_payout_eligibility_key:
          input.legacyPayoutEligibilityKey ?? null,
        creator_id: input.creatorId,
        payout_request_id: input.payoutRequestId ?? null,
        eligibility_state: input.eligibilityState,
        requested_amount: input.requestedAmount ?? null,
        requestable_amount: input.requestableAmount ?? null,
        currency: input.currency ?? null,
        account_readiness_state: input.accountReadinessState ?? null,
        requestable_earning_count: input.requestableEarningCount,
        locked_earning_count: input.lockedEarningCount,
        eligibility_runtime_surface: "payout_request_eligibility_runtime",
        eligibility_source: "payout_request_eligibility_policy",
        eligibility_status: input.eligibilityObserved ? "observed" : "skipped",
        decision_metadata: input.decisionMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "payout_eligibility_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_payout_eligibility_lineage").upsert(
      {
        payout_eligibility_lineage_key:
          input.payoutEligibilityLineageKey,
        payout_eligibility_key: input.payoutEligibilityKey,
        legacy_payout_eligibility_key:
          input.legacyPayoutEligibilityKey ?? null,
        allocation_lineage_key: input.allocationLineageKey ?? null,
        allocation_ordering_key: input.allocationOrderingKey ?? null,
        creator_id: input.creatorId,
        payout_request_id: input.payoutRequestId ?? null,
        source_table: "payout_requests",
        source_row_id: input.payoutRequestId ?? null,
        settlement_source_table: "earnings",
        settlement_target_table: "payout_requests",
        lineage_status: input.eligibilityObserved ? "observed" : "skipped",
        lineage_metadata: input.lineageMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "payout_eligibility_lineage_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_eligibility_ordering").upsert(
      {
        eligibility_ordering_key: input.eligibilityOrderingKey,
        payout_eligibility_key: input.payoutEligibilityKey,
        payout_eligibility_lineage_key:
          input.payoutEligibilityLineageKey,
        creator_id: input.creatorId,
        payout_request_id: input.payoutRequestId ?? null,
        eligibility_stage: "payout_request_locked",
        lifecycle_sequence: 10,
        ordering_surface: "payout.eligibility.replay_ordering",
        ordering_timestamp: input.orderingTimestamp,
        ordering_source: input.orderingSource,
        replay_timestamp_source: input.replayTimestampSource,
        ordering_confidence: input.orderingConfidence,
        ordering_metadata: input.orderingMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "eligibility_ordering_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin.from("canonical_settlement_linkage_provenance").upsert(
      {
        settlement_linkage_key: input.settlementLinkageKey,
        payout_eligibility_key: input.payoutEligibilityKey,
        payout_eligibility_lineage_key:
          input.payoutEligibilityLineageKey,
        eligibility_ordering_key: input.eligibilityOrderingKey,
        allocation_lineage_key: input.allocationLineageKey ?? null,
        allocation_ordering_key: input.allocationOrderingKey ?? null,
        creator_id: input.creatorId,
        payout_request_id: input.payoutRequestId ?? null,
        payout_id: input.payoutId ?? null,
        earning_ids: input.earningIds,
        linkage_surface: "settlement.payout_eligibility.linkage",
        linkage_source: "payout_request_service.lock_earnings",
        linkage_status: input.settlementLinkageObserved
          ? "observed"
          : "skipped",
        requested_amount: input.requestedAmount ?? null,
        requestable_amount: input.requestableAmount ?? null,
        linked_amount: input.linkedAmount ?? null,
        currency: input.currency ?? null,
        linkage_metadata: input.linkageMetadata ?? {},
        provenance_metadata: provenanceMetadata,
      },
      { onConflict: "settlement_linkage_key" }
    )
  )

  await assertNoSupabaseError(
    supabaseAdmin
      .from("canonical_eligibility_reconstruction_metadata")
      .upsert(
        {
          eligibility_reconstruction_key:
            input.eligibilityReconstructionKey,
          payout_eligibility_key: input.payoutEligibilityKey,
          payout_eligibility_lineage_key:
            input.payoutEligibilityLineageKey,
          eligibility_ordering_key: input.eligibilityOrderingKey,
          settlement_linkage_key: input.settlementLinkageKey,
          creator_id: input.creatorId,
          payout_request_id: input.payoutRequestId ?? null,
          reconstruction_surface: "payout.eligibility.reconstruction",
          reconstruction_status: "observed",
          reconstruction_confidence: input.reconstructionConfidence,
          eligibility_observed: input.eligibilityObserved,
          earnings_snapshot_observed: input.earningsSnapshotObserved,
          settlement_linkage_observed: input.settlementLinkageObserved,
          replay_safe_ordering_observed:
            input.replaySafeOrderingObserved,
          replay_safe_reconstructable: input.replaySafeReconstructable,
          reconstruction_metadata: input.reconstructionMetadata ?? {},
          provenance_metadata: provenanceMetadata,
        },
        { onConflict: "eligibility_reconstruction_key" }
      )
  )
}

export async function writeCanonicalPayoutEligibilityProvenanceNoThrow(
  input: CanonicalPayoutEligibilityProvenanceInsert
): Promise<void> {
  try {
    await writeCanonicalPayoutEligibilityProvenance(input)
  } catch (error) {
    logger.warn({
      event: "payout.traceability.canonical_eligibility_provenance.write_failed",
      message: "Canonical payout eligibility provenance write failed",
      error,
    })
  }
}
