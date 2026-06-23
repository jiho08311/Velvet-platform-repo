import type { ClaimedOutboxEvent } from "@/modules/events/contracts/claimed-outbox-event"
import {
  upsertAudienceMetricRollup,
  type UpsertAudienceMetricRollupInput,
} from "@/modules/analytics/repositories/audience-metric-rollup-repository"
import { emitAudienceMetricRecordedEvent } from "@/modules/analytics/events/audience-metric-recorded"

type AudienceSourceEventType =
  | "SubscriptionActivated"
  | "SubscriptionCancelled"
  | "EntitlementGrantObserved"
  | "EntitlementRevokeObserved"

type AudienceEventPayload = {
  subscriptionId?: string
  userId?: string
  subscriberId?: string
  creatorId?: string
  recipientUserId?: string
  occurredAt?: string
}

function isAudienceSourceEvent(
  eventType: string
): eventType is AudienceSourceEventType {
  return (
    eventType === "SubscriptionActivated" ||
    eventType === "SubscriptionCancelled" ||
    eventType === "EntitlementGrantObserved" ||
    eventType === "EntitlementRevokeObserved"
  )
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

function toAudienceRollupInput(
  event: ClaimedOutboxEvent
): UpsertAudienceMetricRollupInput | null {
  if (!isAudienceSourceEvent(event.event_type)) {
    return null
  }

  const payload = event.payload as AudienceEventPayload

  const creatorId =
    readString(payload.creatorId) ??
    (typeof event.payload?.creatorId === "string"
      ? event.payload.creatorId
      : null)

  if (!creatorId) {
    return null
  }

  const occurredAt =
    readString(payload.occurredAt) ?? new Date().toISOString()

  const isStart =
    event.event_type === "SubscriptionActivated" ||
    event.event_type === "EntitlementGrantObserved"

  const isCancel =
    event.event_type === "SubscriptionCancelled" ||
    event.event_type === "EntitlementRevokeObserved"

  return {
    creator_id: creatorId,
    period_start: dayStart(occurredAt),
    period_end: dayEnd(occurredAt),
    subscriber_count: isStart ? 1 : 0,
    active_subscribers: isStart ? 1 : 0,
    new_subscribers: isStart ? 1 : 0,
    churned_subscribers: isCancel ? 1 : 0,
    source_event_id: event.event_id,
    idempotency_key: `audience:${event.event_type}:${event.event_id}`,
  }
}

export async function recordAudienceMetricFromEvent(
  event: ClaimedOutboxEvent
): Promise<{
  status: "recorded" | "skipped"
  reason?: string
}> {
  const input = toAudienceRollupInput(event)

  if (!input) {
    return {
      status: "skipped",
      reason: `not_audience_event:${event.event_type}`,
    }
  }

  const { data, error } = await upsertAudienceMetricRollup(input)

  if (error) {
    throw error
  }

  if (data) {
    await emitAudienceMetricRecordedEvent({
      rollupId: data.rollup_id,
      creatorId: data.creator_id,
      periodStart: data.period_start,
      periodEnd: data.period_end,
      subscriberCount: Number(data.subscriber_count ?? 0),
      activeSubscribers: Number(data.active_subscribers ?? 0),
      newSubscribers: Number(data.new_subscribers ?? 0),
      churnedSubscribers: Number(data.churned_subscribers ?? 0),
      sourceEventId: data.source_event_id,
      occurredAt: data.computed_at,
    })
  }

  return {
    status: "recorded",
  }
}
