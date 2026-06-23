import { writeCanonicalPayoutEligibilityProvenanceNoThrow } from "./canonical-payout-eligibility-provenance-repository"
import { isWave010PayoutEligibilityProvenanceEnabled } from "./feature-flags"
import { logger } from "@/shared/observability/structured-logger"

type JsonRecord = Record<string, unknown>

export type PayoutEligibilityProvenanceInput = Readonly<{
  creatorId: string
  payoutRequestId?: string | null
  payoutId?: string | null
  earningIds?: readonly string[]
  requestedAmount?: number | null
  requestableAmount?: number | null
  currency?: string | null
  accountReadinessState?: "ready" | "missing" | null
  eligibilityState: string
  eligibilityObserved?: boolean
  orderingTimestamp?: string | null
  orderingSource?: string
  replayTimestampSource?: string
  requestableEarningCount?: number
  lockedEarningCount?: number
  allocationLineageKey?: string | null
  allocationOrderingKey?: string | null
  decisionMetadata?: JsonRecord
  lineageMetadata?: JsonRecord
  orderingMetadata?: JsonRecord
  linkageMetadata?: JsonRecord
  reconstructionMetadata?: JsonRecord
  provenanceMetadata?: JsonRecord
}>

export type PayoutEligibilityProvenanceValidationInput = Readonly<{
  eligibilityOrderingDriftDetected?: boolean
  replaySafeEligibilityGapDetected?: boolean
  settlementLinkageMismatchDetected?: boolean
  orphanedEligibilityLineageDetected?: boolean
  eligibilityLineageDivergenceDetected?: boolean
  eligibilityReconstructionInstabilityDetected?: boolean
  replayOwnedEligibilityMutationDetected?: boolean
  settlementAuthorityContaminationDetected?: boolean
  projectionOwnedBalanceAuthorityDetected?: boolean
  immutableLedgerPromotionDetected?: boolean
}>

export type PayoutEligibilityProvenanceValidation = Readonly<{
  readinessState: "advisory_ready" | "blocked"
  driftClass: string
  driftSeverity: "none" | "advisory" | "promotion_blocking"
  blockers: readonly string[]
  runtimeAuthoritative: true
  earningsAuthoritative: true
  payoutEligibilityRuntimeAuthoritative: true
  settlementRuntimeAuthoritative: true
  canonicalAuthoritative: false
  servingAuthoritative: false
  immutableLedgerPromotionAllowed: false
  payoutAuthorityTransferAllowed: false
  payoutEligibilityReplacementAllowed: false
  replayMutationAllowed: false
  replayOwnedExecutionAllowed: false
  projectionBalanceAuthorityAllowed: false
  reconciliationRepairAllowed: false
}>

function stableKeyPart(value: string | null | undefined): string {
  return value == null || value.trim() === "" ? "unknown" : value.trim()
}

function observed(value: string | null | undefined): boolean {
  return value != null && value.trim() !== ""
}

function observedAmount(value: number | null | undefined): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
}

function createEligibilityKeys(input: PayoutEligibilityProvenanceInput) {
  const creator = stableKeyPart(input.creatorId)
  const payoutRequest = stableKeyPart(input.payoutRequestId)

  return {
    legacyPayoutEligibilityKey: [
      "payout_eligibility",
      "payout_request_locked",
      creator,
      payoutRequest,
    ].join(":"),
    payoutEligibilityKey: [
      "canonical_payout_eligibility",
      "payout_request_locked",
      creator,
      payoutRequest,
    ].join(":"),
    payoutEligibilityLineageKey: [
      "canonical_payout_eligibility_lineage",
      "payout_request_locked",
      creator,
      payoutRequest,
    ].join(":"),
    eligibilityOrderingKey: [
      "canonical_eligibility_ordering",
      "payout_request_locked",
      creator,
      payoutRequest,
    ].join(":"),
    settlementLinkageKey: [
      "canonical_settlement_linkage",
      "payout_request_locked",
      creator,
      payoutRequest,
    ].join(":"),
    eligibilityReconstructionKey: [
      "canonical_eligibility_reconstruction",
      "payout_request_locked",
      creator,
      payoutRequest,
    ].join(":"),
    allocationLineageKey:
      input.allocationLineageKey ??
      [
        "allocation_lineage",
        "payout_request_locked",
        creator,
        payoutRequest,
      ].join(":"),
    allocationOrderingKey:
      input.allocationOrderingKey ??
      [
        "allocation_ordering",
        "payout_request_locked",
        creator,
        payoutRequest,
      ].join(":"),
  }
}

function reconstructionConfidence(input: {
  eligibilityObserved: boolean
  earningsSnapshotObserved: boolean
  settlementLinkageObserved: boolean
  replaySafeOrderingObserved: boolean
}): string {
  if (
    input.eligibilityObserved &&
    input.earningsSnapshotObserved &&
    input.settlementLinkageObserved &&
    input.replaySafeOrderingObserved
  ) {
    return "eligibility_runtime_reconstructable_complete"
  }

  if (input.eligibilityObserved && input.replaySafeOrderingObserved) {
    return "eligibility_runtime_reconstructable_partial"
  }

  return "eligibility_runtime_reconstructable_incomplete"
}

export async function synchronizePayoutEligibilityProvenanceNoThrow(
  input: PayoutEligibilityProvenanceInput
): Promise<void> {
  if (!isWave010PayoutEligibilityProvenanceEnabled()) return

  try {
    const keys = createEligibilityKeys(input)
    const earningIds = input.earningIds ?? []
    const orderingTimestamp =
      input.orderingTimestamp ?? new Date().toISOString()
    const eligibilityObserved =
      input.eligibilityObserved ?? observed(input.eligibilityState)
    const earningsSnapshotObserved =
      (input.requestableEarningCount ?? 0) > 0 || earningIds.length > 0
    const settlementLinkageObserved =
      observed(input.payoutRequestId) && earningIds.length > 0
    const replaySafeOrderingObserved = observed(orderingTimestamp)
    const reconstruction = reconstructionConfidence({
      eligibilityObserved,
      earningsSnapshotObserved,
      settlementLinkageObserved,
      replaySafeOrderingObserved,
    })

    await writeCanonicalPayoutEligibilityProvenanceNoThrow({
      ...keys,
      creatorId: input.creatorId,
      payoutRequestId: input.payoutRequestId ?? null,
      payoutId: input.payoutId ?? null,
      earningIds,
      eligibilityState: input.eligibilityState,
      requestedAmount: input.requestedAmount ?? null,
      requestableAmount: input.requestableAmount ?? null,
      linkedAmount: input.requestableAmount ?? null,
      currency: input.currency ?? null,
      accountReadinessState: input.accountReadinessState ?? null,
      requestableEarningCount:
        input.requestableEarningCount ?? earningIds.length,
      lockedEarningCount: input.lockedEarningCount ?? earningIds.length,
      orderingTimestamp,
      orderingSource:
        input.orderingSource ??
        "payout_request_service.lock_earnings.eligibility_observed",
      replayTimestampSource:
        input.replayTimestampSource ?? "payout_requests.created_at",
      orderingConfidence:
        reconstruction === "eligibility_runtime_reconstructable_complete"
          ? "observed_runtime_eligibility_complete"
          : "observed_runtime_eligibility_partial",
      reconstructionConfidence: reconstruction,
      eligibilityObserved,
      earningsSnapshotObserved,
      settlementLinkageObserved,
      replaySafeOrderingObserved,
      replaySafeReconstructable:
        reconstruction !== "eligibility_runtime_reconstructable_incomplete",
      decisionMetadata: {
        ...(input.decisionMetadata ?? {}),
        observedRequestedAmount: observedAmount(input.requestedAmount),
        observedRequestableAmount: observedAmount(input.requestableAmount),
        payoutEligibilityReplacementAllowed: false,
      },
      lineageMetadata: {
        ...(input.lineageMetadata ?? {}),
        earningIds,
        payoutEligibilityRuntimeAuthorityPreserved: true,
      },
      orderingMetadata: {
        ...(input.orderingMetadata ?? {}),
        replayOwnedEligibilityMutationAllowed: false,
        orderingTimestamp,
      },
      linkageMetadata: {
        ...(input.linkageMetadata ?? {}),
        settlementLinkageObserved,
        earningsRemainAuthoritativeMutableSettlementState: true,
      },
      reconstructionMetadata: {
        ...(input.reconstructionMetadata ?? {}),
        eligibilityLineageCompletenessMeasurable: true,
        replaySafeEligibilityReconstructionMeasurable: true,
        projectionBalanceAuthorityAllowed: false,
      },
      provenanceMetadata: {
        ...(input.provenanceMetadata ?? {}),
        advisoryOnly: true,
        synchronizedCandidateOnly: true,
      },
    })
  } catch (error) {
    logger.warn({
      event: "payout.traceability.eligibility_provenance.failed_open",
      message: "Payout eligibility provenance failed open",
      error,
    })
  }
}

export function validatePayoutEligibilityProvenanceReadiness(
  input: PayoutEligibilityProvenanceValidationInput
): PayoutEligibilityProvenanceValidation {
  const blockers = [
    input.eligibilityOrderingDriftDetected
      ? "eligibility_ordering_drift_detected"
      : null,
    input.replaySafeEligibilityGapDetected
      ? "replay_safe_eligibility_gap_detected"
      : null,
    input.settlementLinkageMismatchDetected
      ? "settlement_linkage_mismatch_detected"
      : null,
    input.orphanedEligibilityLineageDetected
      ? "orphaned_eligibility_lineage_detected"
      : null,
    input.eligibilityLineageDivergenceDetected
      ? "eligibility_lineage_divergence_detected"
      : null,
    input.eligibilityReconstructionInstabilityDetected
      ? "eligibility_reconstruction_instability_detected"
      : null,
    input.replayOwnedEligibilityMutationDetected
      ? "replay_owned_eligibility_mutation_detected"
      : null,
    input.settlementAuthorityContaminationDetected
      ? "settlement_authority_contamination_detected"
      : null,
    input.projectionOwnedBalanceAuthorityDetected
      ? "projection_owned_balance_authority_detected"
      : null,
    input.immutableLedgerPromotionDetected
      ? "immutable_ledger_promotion_detected"
      : null,
  ].filter((blocker): blocker is string => blocker != null)

  return {
    readinessState: blockers.length > 0 ? "blocked" : "advisory_ready",
    driftClass: blockers[0] ?? "none",
    driftSeverity: blockers.length > 0 ? "promotion_blocking" : "none",
    blockers,
    runtimeAuthoritative: true,
    earningsAuthoritative: true,
    payoutEligibilityRuntimeAuthoritative: true,
    settlementRuntimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    immutableLedgerPromotionAllowed: false,
    payoutAuthorityTransferAllowed: false,
    payoutEligibilityReplacementAllowed: false,
    replayMutationAllowed: false,
    replayOwnedExecutionAllowed: false,
    projectionBalanceAuthorityAllowed: false,
    reconciliationRepairAllowed: false,
  }
}
