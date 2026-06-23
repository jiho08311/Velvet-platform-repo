// src/shared/observability/workflow-trace-context.ts

import type { AuditActorType, AuditCorrelationContext } from "@/shared/observability/audit-event-types"

export type WorkflowRuntimeType =
  | "request"
  | "queue"
  | "db_claim"
  | "cron"
  | "manual_retry"
  | "worker"
  | "unknown"

export type WorkflowTraceRetryMetadata = Readonly<{
  attempt?: number | null
  maxAttempts?: number | null
  isRetry: boolean
  retryReason?: string | null
  previousExecutionId?: string | null
}>

export type WorkflowTraceRuntimeMetadata = Readonly<{
  runtimeType: WorkflowRuntimeType
  queueName?: string | null
  workerId?: string | null
  claimId?: string | null
  cronName?: string | null
  operationName?: string | null
}>

export type WorkflowTraceProvenanceMetadata = Readonly<{
  actorType?: AuditActorType | null
  actorId?: string | null
  source?: string | null
  triggeredBy?: string | null
  startedAt: string
}>

export type WorkflowTraceContext = Readonly<{
  traceId: string
  workflowId: string
  workflowName?: string | null
  executionId: string
  rootExecutionId: string
  parentExecutionId?: string | null
  correlation: AuditCorrelationContext
  retry: WorkflowTraceRetryMetadata
  runtime: WorkflowTraceRuntimeMetadata
  provenance: WorkflowTraceProvenanceMetadata
}>