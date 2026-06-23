// src/shared/observability/create-workflow-trace.ts

import type { AuditActorType, AuditCorrelationContext } from "@/shared/observability/audit-event-types"
import { ensureCorrelationContext } from "@/shared/observability/correlation-id"
import type {
  WorkflowRuntimeType,
  WorkflowTraceContext,
  WorkflowTraceRetryMetadata,
  WorkflowTraceRuntimeMetadata,
} from "@/shared/observability/workflow-trace-context"

type CreateWorkflowTraceInput = Readonly<{
  workflowId: string
  workflowName?: string | null
  correlation?: AuditCorrelationContext | null
  runtimeType?: WorkflowRuntimeType
  queueName?: string | null
  workerId?: string | null
  claimId?: string | null
  cronName?: string | null
  operationName?: string | null
  actorType?: AuditActorType | null
  actorId?: string | null
  source?: string | null
  triggeredBy?: string | null
  attempt?: number | null
  maxAttempts?: number | null
  retryReason?: string | null
  parentExecutionId?: string | null
  rootExecutionId?: string | null
  previousExecutionId?: string | null
  startedAt?: string
}>

function createExecutionId(): string {
  return crypto.randomUUID()
}

function buildRetryMetadata(input: CreateWorkflowTraceInput): WorkflowTraceRetryMetadata {
  return Object.freeze({
    attempt: input.attempt ?? null,
    maxAttempts: input.maxAttempts ?? null,
    isRetry: Boolean(input.previousExecutionId || input.retryReason),
    retryReason: input.retryReason ?? null,
    previousExecutionId: input.previousExecutionId ?? null,
  })
}

function buildRuntimeMetadata(input: CreateWorkflowTraceInput): WorkflowTraceRuntimeMetadata {
  return Object.freeze({
    runtimeType: input.runtimeType ?? "unknown",
    queueName: input.queueName ?? null,
    workerId: input.workerId ?? null,
    claimId: input.claimId ?? null,
    cronName: input.cronName ?? null,
    operationName: input.operationName ?? null,
  })
}

export function createWorkflowTraceContext(
  input: CreateWorkflowTraceInput
): WorkflowTraceContext {
  const workflowId = input.workflowId.trim()

  if (!workflowId) {
    throw new Error("WORKFLOW_TRACE_WORKFLOW_ID_REQUIRED")
  }

  const executionId = createExecutionId()
  const correlation = ensureCorrelationContext({
    ...input.correlation,
    workflowId,
  })

  return Object.freeze({
    traceId: createExecutionId(),
    workflowId,
    workflowName: input.workflowName ?? workflowId,
    executionId,
    rootExecutionId: input.rootExecutionId ?? executionId,
    parentExecutionId: input.parentExecutionId ?? null,
    correlation,
    retry: buildRetryMetadata(input),
    runtime: buildRuntimeMetadata(input),
    provenance: Object.freeze({
      actorType: input.actorType ?? null,
      actorId: input.actorId ?? null,
      source: input.source ?? null,
      triggeredBy: input.triggeredBy ?? null,
      startedAt: input.startedAt ?? new Date().toISOString(),
    }),
  })
}

export function createChildWorkflowTraceContext(
  parent: WorkflowTraceContext,
  input: Omit<CreateWorkflowTraceInput, "correlation" | "rootExecutionId" | "parentExecutionId">
): WorkflowTraceContext {
  return createWorkflowTraceContext({
    ...input,
    correlation: parent.correlation,
    rootExecutionId: parent.rootExecutionId,
    parentExecutionId: parent.executionId,
  })
}

export function createRetryWorkflowTraceContext(
  previous: WorkflowTraceContext,
  input: Omit<CreateWorkflowTraceInput, "correlation" | "workflowId" | "rootExecutionId" | "parentExecutionId" | "previousExecutionId">
): WorkflowTraceContext {
  return createWorkflowTraceContext({
    ...input,
    workflowId: previous.workflowId,
    workflowName: previous.workflowName,
    correlation: previous.correlation,
    rootExecutionId: previous.rootExecutionId,
    parentExecutionId: previous.parentExecutionId,
    previousExecutionId: previous.executionId,
  })
}

export function toAuditCorrelationContext(
  trace: WorkflowTraceContext
): AuditCorrelationContext {
  return Object.freeze({
    correlationId: trace.correlation.correlationId ?? null,
    requestId: trace.correlation.requestId ?? null,
    workflowId: trace.workflowId,
    jobId: trace.correlation.jobId ?? null,
    causationId: trace.correlation.causationId ?? null,
  })
}