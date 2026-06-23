import type {
  AuditActorType,
  AuditAuthorityScope,
  AuditCorrelationContext,
  AuditMetadata,
} from "@/shared/observability/audit-event-types"
import { ensureCorrelationContext } from "@/shared/observability/correlation-id"
import { logger } from "@/shared/observability/structured-logger"

export type PayoutTracePhase =
  | "request_approved"
  | "request_rejected"
  | "terminal_paid"
  | "terminal_failed"
  | "manual_retry"

export type PayoutTraceAuthority =
  | "payout_request_approval"
  | "payout_request_rejection"
  | "payout_terminal_execution"
  | "payout_terminal_failure"
  | "payout_manual_retry"

export type PayoutTraceActor = Readonly<{
  actorType: AuditActorType
  actorId?: string | null
}>

export type PayoutTraceSource = Readonly<{
  sourceFile?: string | null
  operationName?: string | null
}>

export type PayoutTrace = Readonly<{
  traceId: string
  phase: PayoutTracePhase
  payoutId?: string | null
  payoutRequestId?: string | null
  actor: PayoutTraceActor
  authorityScope: AuditAuthorityScope
  correlation: AuditCorrelationContext
  linkedEarningIds: readonly string[]
  source: PayoutTraceSource
  observedAt: string
  metadata: AuditMetadata
}>

type CreatePayoutTraceInput = Readonly<{
  phase: PayoutTracePhase
  authority: PayoutTraceAuthority
  payoutId?: string | null
  payoutRequestId?: string | null
  actor?: Partial<PayoutTraceActor> | null
  correlation?: AuditCorrelationContext | null
  linkedEarningIds?: string[]
  source?: PayoutTraceSource
  observedAt?: string
  metadata?: AuditMetadata
}>

function createTraceId(): string {
  return crypto.randomUUID()
}

function createAuthorityScope(
  authority: PayoutTraceAuthority,
  payoutId?: string | null,
  payoutRequestId?: string | null
): AuditAuthorityScope {
  return Object.freeze({
    authority,
    resourceType: payoutId ? "payout" : "payout_request",
    resourceId: payoutId ?? payoutRequestId ?? null,
  })
}

export function createPayoutTrace(input: CreatePayoutTraceInput): PayoutTrace {
  return Object.freeze({
    traceId: createTraceId(),
    phase: input.phase,
    payoutId: input.payoutId ?? null,
    payoutRequestId: input.payoutRequestId ?? null,
    actor: Object.freeze({
      actorType: input.actor?.actorType ?? "unknown",
      actorId: input.actor?.actorId ?? null,
    }),
    authorityScope: createAuthorityScope(
      input.authority,
      input.payoutId,
      input.payoutRequestId
    ),
    correlation: ensureCorrelationContext(input.correlation),
    linkedEarningIds: Object.freeze(input.linkedEarningIds ?? []),
    source: Object.freeze({
      sourceFile: input.source?.sourceFile ?? null,
      operationName: input.source?.operationName ?? null,
    }),
    observedAt: input.observedAt ?? new Date().toISOString(),
    metadata: Object.freeze(input.metadata ?? {}),
  })
}

function isPayoutTraceEnabled(): boolean {
  return process.env.PAYOUT_TRACE === "1"
}

export function tracePayoutExecution(trace: PayoutTrace): void {
  if (!isPayoutTraceEnabled()) {
    return
  }

  try {
    logger.info({
      event: "observability.payout_trace",
      context: { trace },
    })
  } catch {
    // Payout tracing must never affect payout execution.
  }
}

export function createAndTracePayout(
  input: CreatePayoutTraceInput
): PayoutTrace {
  const trace = createPayoutTrace(input)
  tracePayoutExecution(trace)
  return trace
}
