import type { AuditCorrelationContext } from "@/shared/observability/audit-event-types"
import { ensureCorrelationContext } from "@/shared/observability/correlation-id"
import { appendGovernanceEvent } from "@/modules/governance/repositories/governance-event-repository"
import {
  insertAuditLogProjection,
  type AuditMetadata,
} from "@/modules/governance/repositories/audit-log-projection-repository"

export type GovernanceAuditInput = {
  actorId?: string | null
  action: string
  targetType: string
  targetId: string
  metadata?: AuditMetadata
  correlation?: AuditCorrelationContext
}

function buildGovernanceEventKey(input: {
  action: string
  targetType: string
  targetId: string
  correlationId?: string | null
}) {
  return [
    "audit",
    input.action,
    input.targetType,
    input.targetId,
    input.correlationId ?? Date.now().toString(),
  ].join(":")
}

export async function executeRecordGovernanceAuditRuntime(
  input: GovernanceAuditInput
): Promise<void> {
  const safeTargetId = input.targetId.trim()

  if (!safeTargetId) {
    throw new Error("AUDIT_TARGET_REQUIRED")
  }

  const correlationContext = ensureCorrelationContext(input.correlation)
  const correlationMetadata = {
    correlationId: correlationContext.correlationId ?? null,
    requestId: correlationContext.requestId ?? null,
    workflowId: correlationContext.workflowId ?? null,
    jobId: correlationContext.jobId ?? null,
    causationId: correlationContext.causationId ?? null,
  }

  const metadata = {
    ...(input.metadata ?? {}),
    correlation: correlationMetadata,
  }

  await appendGovernanceEvent({
    governanceEventKey: buildGovernanceEventKey({
      action: input.action,
      targetType: input.targetType,
      targetId: safeTargetId,
      correlationId: correlationContext.correlationId,
    }),
    aggregateOwner: "platform_governance",
    aggregateRoot: "operational_audit",
    domainName: "platform_governance",
    eventType: input.action,
    eventStatus: "recorded",
    governancePayload: {
      actorId: input.actorId ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: safeTargetId,
      metadata,
    },
    correlationKeys: correlationMetadata,
    eventMetadata: {
      sourceSurface: "governance.audit.runtime",
    },
    provenanceMetadata: {
      projectionTarget: "audit_logs",
    },
  })

  await insertAuditLogProjection({
    actorId: input.actorId,
    action: input.action,
    targetType: input.targetType,
    targetId: safeTargetId,
    metadata,
  })
}
