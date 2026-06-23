export type Wave010PaymentCanonicalFlag =
  | "W10_DOMAIN_ENABLED"
  | "W10_SCHEMA_ENABLED"
  | "W10_DUAL_WRITE_ENABLED"
  | "W10_LINEAGE_ENABLED"
  | "W10_RECONCILIATION_ENABLED"
  | "W10_PARITY_ENABLED"
  | "W10_OBSERVABILITY_ENABLED"
  | "WAVE_010_KILL_SWITCH"
  | "WAVE_010_PAYMENT_TRACEABILITY_KILL_SWITCH"
  | "WAVE_010_PAYMENT_FANOUT_TRACEABILITY_KILL_SWITCH"
  | "WAVE_010_PAYMENT_SIDE_EFFECT_LINEAGE_KILL_SWITCH"
  | "WAVE_010_PROVIDER_CORRELATION_TRACEABILITY_KILL_SWITCH"
  | "WAVE_010_PAYMENT_RECONSTRUCTION_KILL_SWITCH"
  | "WAVE_010_PAYMENT_RECONCILIATION_KILL_SWITCH"

function isFlagOn(flag: Wave010PaymentCanonicalFlag): boolean {
  return process.env[flag] === "1" || process.env[flag] === "true"
}

export function isWave010PaymentTraceabilityEnabled(): boolean {
  return (
    isFlagOn("W10_DOMAIN_ENABLED") &&
    isFlagOn("W10_SCHEMA_ENABLED") &&
    isFlagOn("W10_DUAL_WRITE_ENABLED") &&
    isFlagOn("W10_LINEAGE_ENABLED") &&
    !isFlagOn("WAVE_010_KILL_SWITCH") &&
    !isFlagOn("WAVE_010_PAYMENT_TRACEABILITY_KILL_SWITCH")
  )
}

export function isWave010PaymentReconciliationReadinessEnabled(): boolean {
  return (
    isWave010PaymentTraceabilityEnabled() &&
    isFlagOn("W10_RECONCILIATION_ENABLED") &&
    isFlagOn("W10_PARITY_ENABLED") &&
    !isFlagOn("WAVE_010_PAYMENT_RECONCILIATION_KILL_SWITCH")
  )
}

export function isWave010PaymentFanoutTraceabilityEnabled(): boolean {
  return (
    isWave010PaymentTraceabilityEnabled() &&
    !isFlagOn("WAVE_010_PAYMENT_FANOUT_TRACEABILITY_KILL_SWITCH")
  )
}

export function isWave010PaymentSideEffectLineageEnabled(): boolean {
  return (
    isWave010PaymentTraceabilityEnabled() &&
    !isFlagOn("WAVE_010_PAYMENT_SIDE_EFFECT_LINEAGE_KILL_SWITCH")
  )
}

export function isWave010ProviderCorrelationTraceabilityEnabled(): boolean {
  return (
    isWave010PaymentTraceabilityEnabled() &&
    !isFlagOn("WAVE_010_PROVIDER_CORRELATION_TRACEABILITY_KILL_SWITCH")
  )
}

export function isWave010PaymentReconstructionEnabled(): boolean {
  return (
    isWave010PaymentTraceabilityEnabled() &&
    !isFlagOn("WAVE_010_PAYMENT_RECONSTRUCTION_KILL_SWITCH")
  )
}

export const isWave010CrossAggregateCorrelationEnabled =
  isWave010ProviderCorrelationTraceabilityEnabled