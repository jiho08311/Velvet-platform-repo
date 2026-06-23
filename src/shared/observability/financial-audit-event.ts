// src/shared/observability/financial-audit-event.ts

import { createAuditEvent } from "@/shared/observability/create-audit-event"
import type {
  AuditActor,
  AuditCorrelationContext,
  AuditMetadata,
} from "@/shared/observability/audit-event-types"

export type FinancialAuditAction =
  | "payment_confirmed"
  | "payment_refunded"
  | "earning_created"
  | "earning_reversed"
  | "earning_released"
  | "payout_approved"
  | "payout_paid"
  | "payout_failed"

export type FinancialAuditTargetType =
  | "payment"
  | "earning"
  | "payout"
  | "payout_request"

type CreateFinancialAuditEventInput = Readonly<{
  action: FinancialAuditAction
  actor: AuditActor
  targetType: FinancialAuditTargetType
  targetId: string
  correlation?: AuditCorrelationContext
  metadata?: AuditMetadata
  occurredAt?: string
}>

export function createFinancialAuditEvent({
  action,
  actor,
  targetType,
  targetId,
  correlation,
  metadata,
  occurredAt,
}: CreateFinancialAuditEventInput) {
  return createAuditEvent({
    category: "financial",
    severity: "info",
    action,
    actor,
    authorityScope: {
      authority: "legacy_mutable_financial_lifecycle_runtime",
      resourceType: targetType,
      resourceId: targetId,
    },
    correlation: {
      correlationId: correlation?.correlationId ?? crypto.randomUUID(),
      requestId: correlation?.requestId ?? null,
      workflowId: correlation?.workflowId ?? null,
      jobId: correlation?.jobId ?? null,
      causationId: correlation?.causationId ?? null,
    },
    metadata: metadata ?? {},
    occurredAt,
  })
}