export type CanonicalEntitlementEventValidationInput = Readonly<{
  entitlementLineageDivergenceDetected?: boolean
  entitlementOrderingDriftDetected?: boolean
  replaySafeEntitlementGapDetected?: boolean
  subscriptionLineageMismatchDetected?: boolean
  missingEntitlementLineageDetected?: boolean
  replayOwnedEntitlementMutationDetected?: boolean
  entitlementAuthorityContaminationDetected?: boolean
  projectionOwnedEntitlementAuthorityDetected?: boolean
}>

export type CanonicalEntitlementEventValidation = Readonly<{
  readinessState: "advisory_ready" | "blocked"
  driftClass: string
  driftSeverity: "none" | "advisory" | "promotion_blocking"
  blockers: readonly string[]
  runtimeAuthoritative: true
  subscriptionRuntimeAuthoritative: true
  entitlementRuntimeAuthoritative: true
  canonicalAuthoritative: false
  servingAuthoritative: false
  replayOwnedEntitlementMutationAllowed: false
  entitlementAuthorityPromotionAllowed: false
  projectionEntitlementAuthorityAllowed: false
}>

export function validateCanonicalEntitlementEventReadiness(
  input: CanonicalEntitlementEventValidationInput
): CanonicalEntitlementEventValidation {
  const blockers = [
    input.entitlementLineageDivergenceDetected
      ? "entitlement_lineage_divergence_detected"
      : null,
    input.entitlementOrderingDriftDetected
      ? "entitlement_ordering_drift_detected"
      : null,
    input.replaySafeEntitlementGapDetected
      ? "replay_safe_entitlement_gap_detected"
      : null,
    input.subscriptionLineageMismatchDetected
      ? "subscription_lineage_mismatch_detected"
      : null,
    input.missingEntitlementLineageDetected
      ? "missing_entitlement_lineage_detected"
      : null,
    input.replayOwnedEntitlementMutationDetected
      ? "replay_owned_entitlement_mutation_detected"
      : null,
    input.entitlementAuthorityContaminationDetected
      ? "entitlement_authority_contamination_detected"
      : null,
    input.projectionOwnedEntitlementAuthorityDetected
      ? "projection_owned_entitlement_authority_detected"
      : null,
  ].filter((blocker): blocker is string => blocker != null)

  return {
    readinessState: blockers.length > 0 ? "blocked" : "advisory_ready",
    driftClass: blockers[0] ?? "none",
    driftSeverity: blockers.length > 0 ? "promotion_blocking" : "none",
    blockers,
    runtimeAuthoritative: true,
    subscriptionRuntimeAuthoritative: true,
    entitlementRuntimeAuthoritative: true,
    canonicalAuthoritative: false,
    servingAuthoritative: false,
    replayOwnedEntitlementMutationAllowed: false,
    entitlementAuthorityPromotionAllowed: false,
    projectionEntitlementAuthorityAllowed: false,
  }
}
