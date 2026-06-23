import type { AuditCorrelationContext } from "@/shared/observability/audit-event-types"

export type CorrelationContext = AuditCorrelationContext

export function createCorrelationId(): string {
  return crypto.randomUUID()
}

export function ensureCorrelationContext(
  correlation?: AuditCorrelationContext | null
): AuditCorrelationContext {
  return Object.freeze({
    correlationId: correlation?.correlationId ?? createCorrelationId(),
    requestId: correlation?.requestId ?? null,
    workflowId: correlation?.workflowId ?? null,
    jobId: correlation?.jobId ?? null,
    causationId: correlation?.causationId ?? null,
  })
}

export function getCorrelationId(
  correlation?: AuditCorrelationContext | null
): string {
  return ensureCorrelationContext(correlation).correlationId!
}