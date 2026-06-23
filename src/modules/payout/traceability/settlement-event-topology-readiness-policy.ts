export type SettlementEventTopologyValidationInput = Readonly<{
  paymentId: string
  settlementOrderingDriftDetected?: boolean
  replaySafeSettlementGapDetected?: boolean
  payoutEligibilityMismatchDetected?: boolean
  orphanedEarningLinkageDetected?: boolean
  replayOwnedSettlementMutationDetected?: boolean
  settlementAuthorityContaminationDetected?: boolean
  immutableLedgerPromotionDetected?: boolean
  projectionOwnedBalanceDetected?: boolean
}>

export type SettlementEventTopologyValidation = Readonly<{
  readinessState: "advisory_ready" | "blocked"
  driftClass: string
  driftSeverity: "none" | "advisory" | "promotion_blocking"
  blockers: readonly string[]
  runtimeAuthoritative: true
  earningRuntimeAuthoritative: true
  canonicalAuthoritative: false
  servingAuthoritative: false
  immutableLedgerPromotionAllowed: false
  payoutEligibilityReplacementAllowed: false
  replayMutationAllowed: false
  replayOwnedExecutionAllowed: false
  reconciliationRepairAllowed: false
}>

export function validateSettlementEventTopologyReadiness(
  input: SettlementEventTopologyValidationInput
): SettlementEventTopologyValidation {
  const blockers = [
    input.settlementOrderingDriftDetected
      ? "settlement_ordering_drift_detected"
      : null,
    input.replaySafeSettlementGapDetected
      ? "replay_safe_settlement_gap_detected"
      : null,
    input.payoutEligibilityMismatchDetected
      ? "payout_eligibility_mismatch_detected"
      : null,
    input.orphanedEarningLinkageDetected
      ? "orphaned_earning_linkage_detected"
      : null,
    input.replayOwnedSettlementMutationDetected
      ? "replay_owned_settlement_mutation_detected"
      : null,
    input.settlementAuthorityContaminationDetected
      ? "settlement_authority_contamination_detected"
      : null,
    input.immutableLedgerPromotionDetected
      ? "immutable_ledger_promotion_detected"
      : null,
    input.projectionOwnedBalanceDetected
      ? "projection_owned_balance_detected"
      : null,
  ].filter((blocker): blocker is string => blocker != null)

  return {
    readinessState: blockers.length > 0 ? "blocked" : "advisory_ready",
    driftClass: blockers[0] ?? "none",
    driftSeverity: blockers.length > 0 ? "promotion_blocking" : "none",
    blockers,
    runtimeAuthoritative: true,
    earningRuntimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    immutableLedgerPromotionAllowed: false,
    payoutEligibilityReplacementAllowed: false,
    replayMutationAllowed: false,
    replayOwnedExecutionAllowed: false,
    reconciliationRepairAllowed: false,
  }
}
