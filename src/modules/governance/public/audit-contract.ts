import type { GovernanceAuditInput } from "@/modules/governance/runtime/audit-governance-runtime"
import { executeRecordGovernanceAuditRuntime } from "@/modules/governance/runtime/audit-governance-runtime"

export const PUBLIC_CONTRACT = true

export type { GovernanceAuditInput }

export async function recordGovernanceAudit(
  input: GovernanceAuditInput
): Promise<void> {
  return executeRecordGovernanceAuditRuntime(input)
}

export async function recordFinancialOperationAudit(
  input: GovernanceAuditInput
): Promise<void> {
  return recordGovernanceAudit(input)
}

export async function recordOperationalAudit(
  input: GovernanceAuditInput
): Promise<void> {
  return recordGovernanceAudit(input)
}
