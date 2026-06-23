export type Wave010SettlementCanonicalFlag =
  | "W10_DOMAIN_ENABLED"
  | "W10_SCHEMA_ENABLED"
  | "W10_DUAL_WRITE_ENABLED"
  | "W10_LINEAGE_ENABLED"
  | "WAVE_010_KILL_SWITCH"
  | "WAVE_010_EARNING_CREATION_PROVENANCE_KILL_SWITCH"
  | "WAVE_010_SETTLEMENT_EVENT_TOPOLOGY_KILL_SWITCH"
  | "WAVE_010_SETTLEMENT_ALLOCATION_LINEAGE_KILL_SWITCH"

function isFlagOn(flag: Wave010SettlementCanonicalFlag): boolean {
  return process.env[flag] === "1" || process.env[flag] === "true"
}

export function isWave010EarningCreationProvenanceEnabled(): boolean {
  return (
    isFlagOn("W10_DOMAIN_ENABLED") &&
    isFlagOn("W10_SCHEMA_ENABLED") &&
    isFlagOn("W10_DUAL_WRITE_ENABLED") &&
    isFlagOn("W10_LINEAGE_ENABLED") &&
    !isFlagOn("WAVE_010_KILL_SWITCH") &&
    !isFlagOn("WAVE_010_EARNING_CREATION_PROVENANCE_KILL_SWITCH")
  )
}

export function isWave010SettlementEventTopologyEnabled(): boolean {
  return (
    isFlagOn("W10_DOMAIN_ENABLED") &&
    isFlagOn("W10_SCHEMA_ENABLED") &&
    isFlagOn("W10_DUAL_WRITE_ENABLED") &&
    isFlagOn("W10_LINEAGE_ENABLED") &&
    !isFlagOn("WAVE_010_KILL_SWITCH") &&
    !isFlagOn("WAVE_010_SETTLEMENT_EVENT_TOPOLOGY_KILL_SWITCH")
  )
}

export function isWave010SettlementAllocationLineageEnabled(): boolean {
  return (
    isFlagOn("W10_DOMAIN_ENABLED") &&
    isFlagOn("W10_SCHEMA_ENABLED") &&
    isFlagOn("W10_DUAL_WRITE_ENABLED") &&
    isFlagOn("W10_LINEAGE_ENABLED") &&
    !isFlagOn("WAVE_010_KILL_SWITCH") &&
    !isFlagOn("WAVE_010_SETTLEMENT_ALLOCATION_LINEAGE_KILL_SWITCH")
  )
}


export const isWave010PayoutApprovalProvenanceEnabled =
  isWave010EarningCreationProvenanceEnabled

export const isWave010PayoutEligibilityProvenanceEnabled =
  isWave010SettlementAllocationLineageEnabled

export const isWave010CanonicalPayoutEventTopologyEnabled =
  isWave010SettlementEventTopologyEnabled

export const isWave010PayoutTerminalProvenanceEnabled =
  isWave010SettlementEventTopologyEnabled

export const isWave010SecurityDefinerLineageEnabled =
  isWave010SettlementEventTopologyEnabled

export const isWave010ServiceRoleFinancialExecutionTraceabilityEnabled =
  isWave010SettlementEventTopologyEnabled