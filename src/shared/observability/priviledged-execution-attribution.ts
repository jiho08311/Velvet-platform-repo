// src/shared/observability/privileged-execution-attribution.ts

import type {
  AuditActorType,
  AuditAuthorityScope,
  AuditCorrelationContext,
  AuditMetadata,
} from "@/shared/observability/audit-event-types"
import { ensureCorrelationContext } from "@/shared/observability/correlation-id"
import type { RuntimeProvenanceContext } from "@/shared/observability/runtime-provenance"
import type {
  ServiceRoleAuthorityScope,
  ServiceRoleProvenance,
} from "@/shared/observability/service-role-provenance"
import type { WorkflowTraceContext } from "@/shared/observability/workflow-trace-context"

export type PrivilegedExecutionCategory =
  | "admin"
  | "service_role"
  | "moderation"
  | "financial"
  | "workflow"
  | "system"
  | "unknown"

export type AuthorityEscalationType =
  | "none"
  | "user_to_admin"
  | "admin_to_service_role"
  | "workflow_to_service_role"
  | "cron_to_service_role"
  | "worker_to_service_role"
  | "system_to_service_role"
  | "unknown"

export type PrivilegedActorMetadata = Readonly<{
  actorType: AuditActorType
  actorId?: string | null
}>

export type AuthorityEscalationMetadata = Readonly<{
  escalationType: AuthorityEscalationType
  fromActorType?: AuditActorType | null
  toActorType?: AuditActorType | null
  reason?: string | null
}>

export type PrivilegedWorkflowAttribution = Readonly<{
  workflowId?: string | null
  workflowName?: string | null
  executionId?: string | null
  rootExecutionId?: string | null
  parentExecutionId?: string | null
}>

export type PrivilegedExecutionSource = Readonly<{
  sourceFile?: string | null
  operationName?: string | null
}>

export type PrivilegedExecutionAttribution = Readonly<{
  attributionId: string
  category: PrivilegedExecutionCategory
  actor: PrivilegedActorMetadata
  authorityScope: AuditAuthorityScope
  escalation: AuthorityEscalationMetadata
  workflow: PrivilegedWorkflowAttribution
  correlation: AuditCorrelationContext
  source: PrivilegedExecutionSource
  observedAt: string
  metadata: AuditMetadata
}>

export type CreatePrivilegedExecutionAttributionInput = Readonly<{
  category?: PrivilegedExecutionCategory
  actor?: Partial<PrivilegedActorMetadata> | null
  authorityScope: AuditAuthorityScope
  escalation?: Partial<AuthorityEscalationMetadata> | null
  workflow?: Partial<PrivilegedWorkflowAttribution> | null
  correlation?: AuditCorrelationContext | null
  source?: Partial<PrivilegedExecutionSource> | null
  observedAt?: string
  metadata?: AuditMetadata
}>

function createAttributionId(): string {
  return crypto.randomUUID()
}

function assertNonEmptyString(value: string, errorCode: string): string {
  const safeValue = value.trim()

  if (!safeValue) {
    throw new Error(errorCode)
  }

  return safeValue
}

function serviceRoleAuthorityToAuditAuthority(
  authorityScope: ServiceRoleAuthorityScope
): string {
  return `service_role.${authorityScope}`
}

/**
 * Pure privileged execution attribution builder.
 *
 * This function is intentionally side-effect free:
 * - no DB writes
 * - no console logging
 * - no network calls
 * - no authority promotion
 * - no runtime behavior mutation
 */
export function createPrivilegedExecutionAttribution(
  input: CreatePrivilegedExecutionAttributionInput
): PrivilegedExecutionAttribution {
  const authority = assertNonEmptyString(
    input.authorityScope.authority,
    "PRIVILEGED_ATTRIBUTION_AUTHORITY_REQUIRED"
  )

  const workflowId =
    input.workflow?.workflowId ?? input.correlation?.workflowId ?? null

  const correlation = ensureCorrelationContext({
    ...input.correlation,
    workflowId,
  })

  return Object.freeze({
    attributionId: createAttributionId(),
    category: input.category ?? "unknown",
    actor: Object.freeze({
      actorType: input.actor?.actorType ?? "unknown",
      actorId: input.actor?.actorId ?? null,
    }),
    authorityScope: Object.freeze({
      ...input.authorityScope,
      authority,
      resourceType: input.authorityScope.resourceType ?? null,
      resourceId: input.authorityScope.resourceId ?? null,
    }),
    escalation: Object.freeze({
      escalationType: input.escalation?.escalationType ?? "unknown",
      fromActorType: input.escalation?.fromActorType ?? null,
      toActorType: input.escalation?.toActorType ?? null,
      reason: input.escalation?.reason ?? null,
    }),
    workflow: Object.freeze({
      workflowId,
      workflowName: input.workflow?.workflowName ?? workflowId,
      executionId: input.workflow?.executionId ?? null,
      rootExecutionId: input.workflow?.rootExecutionId ?? null,
      parentExecutionId: input.workflow?.parentExecutionId ?? null,
    }),
    correlation,
    source: Object.freeze({
      sourceFile: input.source?.sourceFile ?? null,
      operationName: input.source?.operationName ?? null,
    }),
    observedAt: input.observedAt ?? new Date().toISOString(),
    metadata: Object.freeze(input.metadata ?? {}),
  })
}

export function privilegedAttributionFromRuntimeProvenance(
  provenance: RuntimeProvenanceContext,
  input: Readonly<{
    category?: PrivilegedExecutionCategory
    escalation?: Partial<AuthorityEscalationMetadata> | null
    metadata?: AuditMetadata
  }> = {}
): PrivilegedExecutionAttribution {
  return createPrivilegedExecutionAttribution({
    category: input.category ?? "unknown",
    actor: {
      actorType: provenance.actor.actorType,
      actorId: provenance.actor.actorId,
    },
    authorityScope: provenance.authorityScope,
    escalation: input.escalation,
    workflow: provenance.workflow,
    correlation: provenance.correlation,
    source: {
      sourceFile: provenance.source.sourceFile,
      operationName: provenance.source.operationName,
    },
    observedAt: provenance.observedAt,
    metadata: input.metadata ?? provenance.metadata,
  })
}

export function privilegedAttributionFromServiceRoleProvenance(
  provenance: ServiceRoleProvenance,
  input: Readonly<{
    category?: PrivilegedExecutionCategory
    escalation?: Partial<AuthorityEscalationMetadata> | null
    metadata?: AuditMetadata
  }> = {}
): PrivilegedExecutionAttribution {
  return createPrivilegedExecutionAttribution({
    category: input.category ?? "service_role",
    actor: {
      actorType:
        provenance.actorType === "workflow"
          ? "worker"
          : provenance.actorType,
      actorId: provenance.actorId,
    },
    authorityScope: {
      authority: serviceRoleAuthorityToAuditAuthority(
        provenance.authorityScope
      ),
    },
    escalation: input.escalation ?? {
      escalationType: "unknown",
      toActorType: "service_role",
    },
    workflow: {
      workflowName: provenance.workflowName,
    },
    correlation: {
      correlationId: provenance.correlationId,
      requestId: provenance.requestId,
      causationId: provenance.causationId,
    },
    source: {
      sourceFile: provenance.sourceFile,
      operationName: provenance.operationName,
    },
    observedAt: provenance.createdAt,
    metadata: input.metadata ?? provenance.metadata,
  })
}

export function privilegedAttributionFromWorkflowTrace(
  trace: WorkflowTraceContext,
  authorityScope: AuditAuthorityScope,
  input: Readonly<{
    category?: PrivilegedExecutionCategory
    escalation?: Partial<AuthorityEscalationMetadata> | null
    metadata?: AuditMetadata
  }> = {}
): PrivilegedExecutionAttribution {
  return createPrivilegedExecutionAttribution({
    category: input.category ?? "workflow",
    actor: {
      actorType: trace.provenance.actorType ?? "unknown",
      actorId: trace.provenance.actorId,
    },
    authorityScope,
    escalation: input.escalation,
    workflow: {
      workflowId: trace.workflowId,
      workflowName: trace.workflowName,
      executionId: trace.executionId,
      rootExecutionId: trace.rootExecutionId,
      parentExecutionId: trace.parentExecutionId,
    },
    correlation: trace.correlation,
    source: {
      sourceFile: trace.provenance.source,
      operationName: trace.runtime.operationName,
    },
    metadata: input.metadata ?? {},
  })
}