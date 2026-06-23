// src/shared/observability/silent-failure-event.ts

import type {
  AuditActorType,
  AuditAuthorityScope,
  AuditCorrelationContext,
  AuditMetadata,
} from "@/shared/observability/audit-event-types"
import { ensureCorrelationContext } from "@/shared/observability/correlation-id"
import type {
  CriticalFailureDomain,
  FailureSeverity,
} from "@/shared/observability/failure-severity"
import { logger } from "@/shared/observability/structured-logger"

export type SilentFailureCategory =
  | "financial_side_effect_swallowed"
  | "notification_side_effect_swallowed"
  | "audit_side_effect_failed"
  | "service_role_execution_failed"
  | "async_worker_loop_error"
  | "async_worker_fatal_error"
  | "media_processing_failed"
  | "media_cleanup_swallowed"
  | "compensation_executed_and_rethrown"
  | "trace_failed_and_rethrown"
  | "ignored_promise_rejection"
  | "fire_and_forget_execution"
  | "partial_failure_swallowed"
  | "non_audited_error_handling"

export type SilentFailureMode =
  | "catch_console_error_only"
  | "catch_noop"
  | "catch_return_fallback"
  | "promise_catch_swallowed"
  | "void_promise"
  | "fire_and_forget"
  | "partial_failure_continued"
  | "compensation_then_rethrow"
  | "trace_then_rethrow"

export type IgnoredExecutionMetadata = Readonly<{
  ignored: boolean
  mechanism?:
    | "void"
    | "catch_noop"
    | "catch_fallback"
    | "fire_and_forget"
    | "all_settled"
    | "unknown"
  promiseObserved?: boolean | null
  rejectionObserved?: boolean | null
}>

export type FailureProvenanceMetadata = Readonly<{
  sourceFile: string
  operationName: string
  domain: CriticalFailureDomain
  actorType?: AuditActorType | null
  actorId?: string | null
  authorityScope?: AuditAuthorityScope | null
  resourceType?: string | null
  resourceId?: string | null
}>

export type SilentFailureErrorMetadata = Readonly<{
  errorName?: string | null
  errorMessage?: string | null
  errorStack?: string | null
}>

export type SilentFailureEvent = Readonly<{
  eventId: string
  category: SilentFailureCategory
  severity: FailureSeverity
  failureMode: SilentFailureMode
  provenance: FailureProvenanceMetadata
  ignoredExecution: IgnoredExecutionMetadata
  correlation: AuditCorrelationContext
  error: SilentFailureErrorMetadata
  observedAt: string
  metadata: AuditMetadata
}>

export type CreateSilentFailureEventInput = Readonly<{
  category: SilentFailureCategory
  severity: FailureSeverity
  failureMode: SilentFailureMode
  provenance: FailureProvenanceMetadata
  ignoredExecution?: Partial<IgnoredExecutionMetadata>
  correlation?: AuditCorrelationContext | null
  error?: unknown
  observedAt?: string
  metadata?: AuditMetadata
}>

function createSilentFailureEventId(): string {
  return crypto.randomUUID()
}

function normalizeError(error: unknown): SilentFailureErrorMetadata {
  if (error instanceof Error) {
    return Object.freeze({
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack ?? null,
    })
  }

  if (typeof error === "string") {
    return Object.freeze({
      errorName: null,
      errorMessage: error,
      errorStack: null,
    })
  }

  return Object.freeze({
    errorName: null,
    errorMessage: null,
    errorStack: null,
  })
}

function buildIgnoredExecutionMetadata(
  ignoredExecution?: Partial<IgnoredExecutionMetadata>
): IgnoredExecutionMetadata {
  return Object.freeze({
    ignored: ignoredExecution?.ignored ?? false,
    mechanism: ignoredExecution?.mechanism ?? "unknown",
    promiseObserved: ignoredExecution?.promiseObserved ?? null,
    rejectionObserved: ignoredExecution?.rejectionObserved ?? null,
  })
}

export function createSilentFailureEvent(
  input: CreateSilentFailureEventInput
): SilentFailureEvent {
  const correlation = ensureCorrelationContext(input.correlation)

  return Object.freeze({
    eventId: createSilentFailureEventId(),
    category: input.category,
    severity: input.severity,
    failureMode: input.failureMode,
    provenance: Object.freeze(input.provenance),
    ignoredExecution: buildIgnoredExecutionMetadata(input.ignoredExecution),
    correlation,
    error: normalizeError(input.error),
    observedAt: input.observedAt ?? new Date().toISOString(),
    metadata: Object.freeze(input.metadata ?? {}),
  })
}

function isSilentFailureTraceEnabled(): boolean {
  return process.env.SILENT_FAILURE_TRACE === "1"
}

export function traceSilentFailureEvent(event: SilentFailureEvent): void {
  if (!isSilentFailureTraceEnabled()) {
    return
  }

  try {
    logger.info({
      event: "observability.silent_failure_event",
      context: { event },
    })
  } catch {
    // Silent failure tracing must never affect production execution.
  }
}

export function createAndTraceSilentFailureEvent(
  input: CreateSilentFailureEventInput
): SilentFailureEvent {
  const event = createSilentFailureEvent(input)
  traceSilentFailureEvent(event)
  return event
}
