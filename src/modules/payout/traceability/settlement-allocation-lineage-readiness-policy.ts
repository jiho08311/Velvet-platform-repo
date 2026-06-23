export type SettlementAllocationLineageValidationInput = Readonly<{
  allocationOrderingDriftDetected?: boolean
  replaySafeAllocationGapDetected?: boolean
  payoutEligibilityMismatchDetected?: boolean
  orphanedAllocationLineageDetected?: boolean
  replayOwnedSettlementMutationDetected?: boolean
  settlementAuthorityContaminationDetected?: boolean
  projectionOwnedBalanceAuthorityDetected?: boolean
  immutableLedgerPromotionDetected?: boolean
}>

export type SettlementAllocationLineageValidation = Readonly<{
  readinessState: "advisory_ready" | "blocked"
  driftClass: string
  driftSeverity: "none" | "advisory" | "promotion_blocking"
  blockers: readonly string[]
  runtimeAuthoritative: true
  earningAllocationRuntimeAuthoritative: true
  payoutEligibilityRuntimeAuthoritative: true
  canonicalAuthoritative: false
  servingAuthoritative: false
  immutableLedgerPromotionAllowed: false
  payoutEligibilityReplacementAllowed: false
  replayMutationAllowed: false
  replayOwnedExecutionAllowed: false
  projectionBalanceAuthorityAllowed: false
  reconciliationRepairAllowed: false
}>

export function validateSettlementAllocationLineageReadiness(
  input: SettlementAllocationLineageValidationInput
): SettlementAllocationLineageValidation {
  const blockers = [
    input.allocationOrderingDriftDetected
      ? "allocation_ordering_drift_detected"
      : null,
    input.replaySafeAllocationGapDetected
      ? "replay_safe_allocation_gap_detected"
      : null,
    input.payoutEligibilityMismatchDetected
      ? "payout_eligibility_mismatch_detected"
      : null,
    input.orphanedAllocationLineageDetected
      ? "orphaned_allocation_lineage_detected"
      : null,
    input.replayOwnedSettlementMutationDetected
      ? "replay_owned_settlement_mutation_detected"
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
    earningAllocationRuntimeAuthoritative: true,
    payoutEligibilityRuntimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    immutableLedgerPromotionAllowed: false,
    payoutEligibilityReplacementAllowed: false,
    replayMutationAllowed: false,
    replayOwnedExecutionAllowed: false,
    projectionBalanceAuthorityAllowed: false,
    reconciliationRepairAllowed: false,
  }
}
