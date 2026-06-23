import { recordFinancialOperationAudit } from "@/modules/governance/public/audit-contract"
import type { AuditCorrelationContext } from "@/shared/observability/audit-event-types"

type AuditAction =
  | "payment_confirmed"
  | "payment_refunded"
  | "earning_created"
  | "earning_reversed"
  | "earning_released"
  | "payout_requested"
  | "payout_approved"
  | "payout_paid"
  | "payout_failed"

type AuditTargetType = "payment" | "earning" | "payout" | "payout_request"

type AuditMetadataValue =
  | string
  | number
  | boolean
  | null
  | AuditMetadataValue[]
  | { [key: string]: AuditMetadataValue }

type AuditMetadata = Record<string, AuditMetadataValue>

type CreateAuditLogInput = {
  actorId?: string | null
  action: AuditAction
  targetType: AuditTargetType
  targetId: string
  metadata?: AuditMetadata
  correlation?: AuditCorrelationContext
}

export async function createAuditLog(input: CreateAuditLogInput): Promise<void> {
  return recordFinancialOperationAudit(input)
}
