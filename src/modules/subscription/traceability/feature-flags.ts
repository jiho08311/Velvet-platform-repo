export type Wave010FinancialIdentityCanonicalFlag =
  | "W10_DOMAIN_ENABLED"
  | "W10_SCHEMA_ENABLED"
  | "W10_DUAL_WRITE_ENABLED"
  | "W10_LINEAGE_ENABLED"
  | "W10_OBSERVABILITY_ENABLED"
  | "WAVE_010_KILL_SWITCH"
  | "WAVE_010_FINANCIAL_IDENTITY_CORRELATION_KILL_SWITCH"

function isFlagOn(flag: Wave010FinancialIdentityCanonicalFlag): boolean {
  return process.env[flag] === "1" || process.env[flag] === "true"
}

export function isWave010FinancialIdentityCorrelationEnabled(): boolean {
  return (
    isFlagOn("W10_DOMAIN_ENABLED") &&
    isFlagOn("W10_SCHEMA_ENABLED") &&
    isFlagOn("W10_DUAL_WRITE_ENABLED") &&
    isFlagOn("W10_LINEAGE_ENABLED") &&
    isFlagOn("W10_OBSERVABILITY_ENABLED") &&
    !isFlagOn("WAVE_010_KILL_SWITCH") &&
    !isFlagOn("WAVE_010_FINANCIAL_IDENTITY_CORRELATION_KILL_SWITCH")
  )
}


export const isWave010EntitlementDriftArbitrationEnabled =
  isWave010FinancialIdentityCorrelationEnabled

export const isWave010CanonicalEntitlementEventEnabled =
  isWave010FinancialIdentityCorrelationEnabled

export const isWave010EntitlementReplayContinuityEnabled =
  isWave010FinancialIdentityCorrelationEnabled

export const isWave010EntitlementReplayPreservationEnabled =
  isWave010FinancialIdentityCorrelationEnabled

export const isWave010EntitlementSovereigntyMapEnabled =
  isWave010FinancialIdentityCorrelationEnabled

export const isWave010EntitlementSovereigntyPreservationEnabled =
  isWave010FinancialIdentityCorrelationEnabled

export const isWave010SubscriptionActivationProvenanceEnabled =
  isWave010FinancialIdentityCorrelationEnabled

export const isWave010SubscriptionValidationBoundaryEnabled =
  isWave010FinancialIdentityCorrelationEnabled