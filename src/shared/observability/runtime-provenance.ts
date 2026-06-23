// src/shared/observability/runtime-provenance.ts

import type {
  AuditActorType,
  AuditAuthorityScope,
  AuditCorrelationContext,
  AuditMetadata,
} from "@/shared/observability/audit-event-types"
import { ensureCorrelationContext } from "@/shared/observability/correlation-id"

export type RuntimeExecutionSourceType =
  | "request"
  | "server_action"
  | "route_handler"
  | "workflow"
  | "queue"
  | "worker"
  | "cron"
  | "manual"
  | "service_role"
  | "webhook"
  | "unknown"

export type RuntimeExecutionActor = Readonly<{
  actorType: AuditActorType
  actorId?: string | null
}>

export type RuntimeExecutionSource = Readonly<{
  sourceType: RuntimeExecutionSourceType
  sourceFile?: string | null
  operationName?: string | null
}>

export type RuntimeWorkflowOrigin = Readonly<{
  workflowId?: string | null
  workflowName?: string | null
  executionId?: string | null
  rootExecutionId?: string | null
  parentExecutionId?: string | null
}>

export type RuntimeProvenanceContext = Readonly<{
  actor: RuntimeExecutionActor
  authorityScope: AuditAuthorityScope
  source: RuntimeExecutionSource
  workflow: RuntimeWorkflowOrigin
  correlation: AuditCorrelationContext
  observedAt: string
  metadata: AuditMetadata
}>

export type CreateRuntimeProvenanceContextInput = Readonly<{
  actor?: Partial<RuntimeExecutionActor> | null
  authorityScope: AuditAuthorityScope
  source?: Partial<RuntimeExecutionSource> | null
  workflow?: RuntimeWorkflowOrigin | null
  correlation?: AuditCorrelationContext | null
  observedAt?: string
  metadata?: AuditMetadata
}>

function assertNonEmptyString(value: string, errorCode: string): string {
  const safeValue = value.trim()

  if (!safeValue) {
    throw new Error(errorCode)
  }

  return safeValue
}

/**
 * Pure canonical runtime provenance builder.
 *
 * This function is intentionally side-effect free:
 * - no DB writes
 * - no console logging
 * - no network calls
 * - no authority promotion
 * - no runtime behavior mutation
 */
export function createRuntimeProvenanceContext(
  input: CreateRuntimeProvenanceContextInput
): RuntimeProvenanceContext {
  const authority = assertNonEmptyString(
    input.authorityScope.authority,
    "RUNTIME_PROVENANCE_AUTHORITY_REQUIRED"
  )

  const workflowId =
    input.workflow?.workflowId ?? input.correlation?.workflowId ?? null

  const correlation = ensureCorrelationContext({
    ...input.correlation,
    workflowId,
  })

  return Object.freeze({
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
    source: Object.freeze({
      sourceType: input.source?.sourceType ?? "unknown",
      sourceFile: input.source?.sourceFile ?? null,
      operationName: input.source?.operationName ?? null,
    }),
    workflow: Object.freeze({
      workflowId,
      workflowName: input.workflow?.workflowName ?? workflowId,
      executionId: input.workflow?.executionId ?? null,
      rootExecutionId: input.workflow?.rootExecutionId ?? null,
      parentExecutionId: input.workflow?.parentExecutionId ?? null,
    }),
    correlation,
    observedAt: input.observedAt ?? new Date().toISOString(),
    metadata: Object.freeze(input.metadata ?? {}),
  })
}

export function runtimeProvenanceToAuditCorrelation(
  provenance: RuntimeProvenanceContext
): AuditCorrelationContext {
  return Object.freeze({
    correlationId: provenance.correlation.correlationId ?? null,
    requestId: provenance.correlation.requestId ?? null,
    workflowId:
      provenance.workflow.workflowId ?? provenance.correlation.workflowId ?? null,
    jobId: provenance.correlation.jobId ?? null,
    causationId: provenance.correlation.causationId ?? null,
  })
}