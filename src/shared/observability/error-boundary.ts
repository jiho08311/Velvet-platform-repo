// src/shared/observability/error-boundary.ts

export type DistributedErrorBoundary =
  | "api_route"
  | "server_action"
  | "workflow"
  | "async_job"
  | "worker"
  | "worker_loop"
  | "queue"
  | "cron"
  | "service"
  | "repository"
  | "external_provider"
  | "notification_fanout"
  | "media_processing"
  | "moderation_processing"
  | "storage"
  | "unknown"

export type ErrorPropagationStage =
  | "raised"
  | "caught"
  | "classified"
  | "traced"
  | "swallowed"
  | "rethrown"
  | "returned_as_error_response"
  | "converted_to_failure_state"
  | "retry_scheduled"
  | "compensation_triggered"
  | "reached_runtime_boundary"
  | "terminated"

export type DistributedErrorOutcome =
  | "recoverable"
  | "terminal"
  | "swallowed"
  | "propagated"
  | "converted_to_state"
  | "unknown"

export type DistributedErrorRecoverability =
  | "recoverable"
  | "terminal"
  | "unknown"

export type ErrorBoundaryTransition = Readonly<{
  from: DistributedErrorBoundary
  to?: DistributedErrorBoundary | null
}>