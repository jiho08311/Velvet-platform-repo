export type CrossAggregateCorrelationValidationInput = Readonly<{
  aggregateLineageDivergenceDetected?: boolean
  aggregateOrderingDriftDetected?: boolean
  replaySafeAggregateGapDetected?: boolean
  crossDomainLineageMismatchDetected?: boolean
  orphanedAggregateLineageDetected?: boolean
  replayOwnedAggregateMutationDetected?: boolean
  governanceOwnedAggregateAuthorityDetected?: boolean
  projectionOwnedSettlementAuthorityDetected?: boolean
}>

export type CrossAggregateCorrelationValidation = Readonly<{
  readinessState: "advisory_ready" | "blocked"
  driftClass: string
  driftSeverity: "none" | "advisory" | "promotion_blocking"
  blockers: readonly string[]
  runtimeAuthoritative: true
  paymentRuntimeAuthoritative: true
  settlementRuntimeAuthoritative: true
  payoutRuntimeAuthoritative: true
  entitlementRuntimeAuthoritative: true
  canonicalAuthoritative: false
  servingAuthoritative: false
  replayOwnedAggregateMutationAllowed: false
  governanceAggregateAuthorityAllowed: false
  projectionSettlementAuthorityAllowed: false
}>

export function validateCrossAggregateCorrelationReadiness(
  input: CrossAggregateCorrelationValidationInput
): CrossAggregateCorrelationValidation {
  const blockers = [
    input.aggregateLineageDivergenceDetected
      ? "aggregate_lineage_divergence_detected"
      : null,
    input.aggregateOrderingDriftDetected
      ? "aggregate_ordering_drift_detected"
      : null,
    input.replaySafeAggregateGapDetected
      ? "replay_safe_aggregate_gap_detected"
      : null,
    input.crossDomainLineageMismatchDetected
      ? "cross_domain_lineage_mismatch_detected"
      : null,
    input.orphanedAggregateLineageDetected
      ? "orphaned_aggregate_lineage_detected"
      : null,
    input.replayOwnedAggregateMutationDetected
      ? "replay_owned_aggregate_mutation_detected"
      : null,
    input.governanceOwnedAggregateAuthorityDetected
      ? "governance_owned_aggregate_authority_detected"
      : null,
    input.projectionOwnedSettlementAuthorityDetected
      ? "projection_owned_settlement_authority_detected"
      : null,
  ].filter((blocker): blocker is string => blocker != null)

  return {
    readinessState: blockers.length > 0 ? "blocked" : "advisory_ready",
    driftClass: blockers[0] ?? "none",
    driftSeverity: blockers.length > 0 ? "promotion_blocking" : "none",
    blockers,
    runtimeAuthoritative: true,
    paymentRuntimeAuthoritative: true,
    settlementRuntimeAuthoritative: true,
    payoutRuntimeAuthoritative: true,
    entitlementRuntimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    replayOwnedAggregateMutationAllowed: false,
    governanceAggregateAuthorityAllowed: false,
    projectionSettlementAuthorityAllowed: false,
  }
}
