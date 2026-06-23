import type {
  AuditActorType,
  AuditAuthorityScope,
  AuditCorrelationContext,
  AuditMetadata,
} from "@/shared/observability/audit-event-types"
import { ensureCorrelationContext } from "@/shared/observability/correlation-id"
import { logger } from "@/shared/observability/structured-logger"

export type RefundTracePhase =
  | "refund_requested"
  | "payment_refunded"
  | "earning_reversed"
  | "subscription_expiry_attempted"

export type RefundTraceAuthority =
  | "payment_refund"
  | "earning_reversal"
  | "subscription_expiry_side_effect"

export type RefundTraceActor = Readonly<{
  actorType: AuditActorType
  actorId?: string | null
}>

export type RefundTraceSource = Readonly<{
  sourceFile?: string | null
  operationName?: string | null
}>

export type RefundTrace = Readonly<{
  traceId: string
  phase: RefundTracePhase
  paymentId: string
  earningId?: string | null
  actor: RefundTraceActor
  authorityScope: AuditAuthorityScope
  correlation: AuditCorrelationContext
  source: RefundTraceSource
  observedAt: string
  metadata: AuditMetadata
}>

type CreateRefundTraceInput = Readonly<{
  phase: RefundTracePhase
  authority: RefundTraceAuthority
  paymentId: string
  earningId?: string | null
  actor?: Partial<RefundTraceActor> | null
  correlation?: AuditCorrelationContext | null
  source?: RefundTraceSource
  observedAt?: string
  metadata?: AuditMetadata
}>

function createTraceId(): string {
  return crypto.randomUUID()
}

function normalizePaymentId(paymentId: string): string {
  const safePaymentId = paymentId.trim()

  if (!safePaymentId) {
    throw new Error("REFUND_TRACE_PAYMENT_ID_REQUIRED")
  }

  return safePaymentId
}

function createAuthorityScope(
  authority: RefundTraceAuthority,
  paymentId: string
): AuditAuthorityScope {
  return Object.freeze({
    authority,
    resourceType: "payment",
    resourceId: paymentId,
  })
}

export function createRefundTrace(input: CreateRefundTraceInput): RefundTrace {
  const paymentId = normalizePaymentId(input.paymentId)

  return Object.freeze({
    traceId: createTraceId(),
    phase: input.phase,
    paymentId,
    earningId: input.earningId ?? null,
    actor: Object.freeze({
      actorType: input.actor?.actorType ?? "unknown",
      actorId: input.actor?.actorId ?? null,
    }),
    authorityScope: createAuthorityScope(input.authority, paymentId),
    correlation: ensureCorrelationContext(input.correlation),
    source: Object.freeze({
      sourceFile: input.source?.sourceFile ?? null,
      operationName: input.source?.operationName ?? null,
    }),
    observedAt: input.observedAt ?? new Date().toISOString(),
    metadata: Object.freeze(input.metadata ?? {}),
  })
}

function isRefundTraceEnabled(): boolean {
  return process.env.REFUND_TRACE === "1"
}

export function traceRefundExecution(trace: RefundTrace): void {
  if (!isRefundTraceEnabled()) {
    return
  }

  try {
    logger.info({
      event: "observability.refund_trace",
      context: { trace },
    })
  } catch {
    // Refund tracing must never affect refund execution.
  }
}

export function createAndTraceRefund(
  input: CreateRefundTraceInput
): RefundTrace {
  const trace = createRefundTrace(input)
  traceRefundExecution(trace)
  return trace
}
