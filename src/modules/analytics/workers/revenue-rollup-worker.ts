import type { ClaimedOutboxEvent } from "@/modules/events/contracts/claimed-outbox-event"
import {
  upsertRevenueMetricRollup,
  type UpsertRevenueMetricRollupInput,
} from "@/modules/analytics/repositories/revenue-metric-rollup-repository"
import { emitRevenueMetricRecordedEvent } from "@/modules/analytics/events/revenue-metric-recorded"
type RevenueSourceEventType =
  | "PaymentConfirmed"
  | "PaymentRefunded"
  | "LedgerMutationObserved"

type RevenueEventPayload = {
  paymentId?: string
  ledgerTransactionId?: string
  creatorId?: string | null
  amount?: number
  grossAmount?: number
  netAmount?: number
  platformFee?: number
  refundAmount?: number
  currency?: string
  occurredAt?: string
}

function isRevenueSourceEvent(eventType: string): eventType is RevenueSourceEventType {
  return (
    eventType === "PaymentConfirmed" ||
    eventType === "PaymentRefunded" ||
    eventType === "LedgerMutationObserved"
  )
}

function readNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const normalized = Number(value)

    if (Number.isFinite(normalized)) {
      return normalized
    }
  }

  return 0
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null
}

function dayStart(value: string): string {
  const date = new Date(value)
  date.setUTCHours(0, 0, 0, 0)
  return date.toISOString()
}

function dayEnd(value: string): string {
  const date = new Date(value)
  date.setUTCHours(23, 59, 59, 999)
  return date.toISOString()
}

function toRevenueRollupInput(
  event: ClaimedOutboxEvent
): UpsertRevenueMetricRollupInput | null {
  if (!isRevenueSourceEvent(event.event_type)) {
    return null
  }

  const payload = event.payload as RevenueEventPayload
  const occurredAt =
    readString(payload.occurredAt) ?? new Date().toISOString()

  const creatorId =
    readString(payload.creatorId) ??
    (typeof event.payload?.creatorId === "string" ? event.payload.creatorId : null)

  const amount = readNumber(payload.amount)
  const grossAmount = readNumber(payload.grossAmount) || amount
  const netAmount = readNumber(payload.netAmount) || grossAmount
  const platformFee = readNumber(payload.platformFee)
  const refundAmount =
    event.event_type === "PaymentRefunded"
      ? readNumber(payload.refundAmount) || amount
      : 0

  return {
    creator_id: creatorId,
    period_start: dayStart(occurredAt),
    period_end: dayEnd(occurredAt),
    gross_revenue: event.event_type === "PaymentRefunded" ? 0 : grossAmount,
    net_revenue: event.event_type === "PaymentRefunded" ? 0 : netAmount,
    platform_fee: event.event_type === "PaymentRefunded" ? 0 : platformFee,
    refund_amount: refundAmount,
    currency: readString(payload.currency) ?? "KRW",
    source_event_id: event.event_id,
    idempotency_key: `revenue:${event.event_type}:${event.event_id}`,
  }
}

export async function recordRevenueMetricFromEvent(
  event: ClaimedOutboxEvent
): Promise<{
  status: "recorded" | "skipped"
  reason?: string
}> {
  const input = toRevenueRollupInput(event)

  if (!input) {
    return {
      status: "skipped",
      reason: `not_revenue_event:${event.event_type}`,
    }
  }

const { data, error } = await upsertRevenueMetricRollup(input)

if (error) {
  throw error
}

if (data) {
  await emitRevenueMetricRecordedEvent({
    rollupId: data.rollup_id,
    creatorId: data.creator_id,
    periodStart: data.period_start,
    periodEnd: data.period_end,
    grossRevenue: Number(data.gross_revenue ?? 0),
    netRevenue: Number(data.net_revenue ?? 0),
    platformFee: Number(data.platform_fee ?? 0),
    refundAmount: Number(data.refund_amount ?? 0),
    currency: data.currency,
    sourceEventId: data.source_event_id,
    occurredAt: data.computed_at,
  })
}

return {
  status: "recorded",
}
}
