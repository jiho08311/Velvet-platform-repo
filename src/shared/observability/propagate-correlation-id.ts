import type { AuditCorrelationContext } from "@/shared/observability/audit-event-types"
import { ensureCorrelationContext } from "@/shared/observability/correlation-id"

export function mergeCorrelationContext(
  correlation: AuditCorrelationContext | null | undefined,
  patch: AuditCorrelationContext
): AuditCorrelationContext {
  const base = ensureCorrelationContext(correlation)

  return Object.freeze({
    correlationId: base.correlationId,
    requestId: patch.requestId ?? base.requestId ?? null,
    workflowId: patch.workflowId ?? base.workflowId ?? null,
    jobId: patch.jobId ?? base.jobId ?? null,
    causationId: patch.causationId ?? base.causationId ?? null,
  })
}

export function withWorkflowCorrelation(
  correlation: AuditCorrelationContext | null | undefined,
  workflowId: string
): AuditCorrelationContext {
  return mergeCorrelationContext(correlation, {
    workflowId,
  })
}

export function withJobCorrelation(
  correlation: AuditCorrelationContext | null | undefined,
  jobId: string
): AuditCorrelationContext {
  return mergeCorrelationContext(correlation, {
    jobId,
  })
}

export function withCausationCorrelation(
  correlation: AuditCorrelationContext | null | undefined,
  causationId: string
): AuditCorrelationContext {
  return mergeCorrelationContext(correlation, {
    causationId,
  })
}