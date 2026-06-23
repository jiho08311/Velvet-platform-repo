import type { ClaimedOutboxEvent } from "@/modules/events/contracts/claimed-outbox-event"
import {
  upsertTrustSafetyMetricRollup,
  type UpsertTrustSafetyMetricRollupInput,
} from "@/modules/analytics/repositories/trust-safety-metric-rollup-repository"
import { emitModerationMetricRecordedEvent } from "@/modules/analytics/events/moderation-metric-recorded"

type ModerationSourceEventType =
  | "TrustSafetyActionIssued"
  | "ContentVisibilityChanged"
  | "UserTrustStateChanged"
  | "ModerationCaseOpened"
  | "ModerationCaseReviewed"
  | "MediaSafetyStateChanged"

type ModerationEventPayload = {
  actionType?: string
  decision?: string
  visibility?: string
  trustState?: string
  occurredAt?: string
}

function isModerationSourceEvent(
  eventType: string
): eventType is ModerationSourceEventType {
  return (
    eventType === "TrustSafetyActionIssued" ||
    eventType === "ContentVisibilityChanged" ||
    eventType === "UserTrustStateChanged" ||
    eventType === "ModerationCaseOpened" ||
    eventType === "ModerationCaseReviewed" ||
    eventType === "MediaSafetyStateChanged"
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

function isRemovalVisibility(value: string | null): boolean {
  return (
    value === "removed" ||
    value === "hidden" ||
    value === "blocked" ||
    value === "restricted"
  )
}

function isSuspendedTrustState(value: string | null): boolean {
  return (
    value === "suspended" ||
    value === "banned" ||
    value === "restricted"
  )
}

function toModerationRollupInput(
  event: ClaimedOutboxEvent
): UpsertTrustSafetyMetricRollupInput | null {
  if (!isModerationSourceEvent(event.event_type)) {
    return null
  }

  const payload = event.payload as ModerationEventPayload
  const occurredAt = readString(payload.occurredAt) ?? new Date().toISOString()

  const visibility = readString(payload.visibility)
  const trustState = readString(payload.trustState)
  const actionType = readString(payload.actionType)

  const reportsReceived = event.event_type === "ModerationCaseOpened" ? 1 : 0
  const casesReviewed = event.event_type === "ModerationCaseReviewed" ? 1 : 0
  const actionsIssued = event.event_type === "TrustSafetyActionIssued" ? 1 : 0

  const contentRemoved =
    event.event_type === "ContentVisibilityChanged" &&
    isRemovalVisibility(visibility)
      ? 1
      : actionType === "remove_content" || actionType === "content_removed"
        ? 1
        : 0

  const usersSuspended =
    event.event_type === "UserTrustStateChanged" &&
    isSuspendedTrustState(trustState)
      ? 1
      : actionType === "suspend_user" || actionType === "ban_user"
        ? 1
        : 0

  return {
    period_start: dayStart(occurredAt),
    period_end: dayEnd(occurredAt),
    reports_received: reportsReceived,
    cases_reviewed: casesReviewed,
    actions_issued: actionsIssued,
    content_removed: contentRemoved,
    users_suspended: usersSuspended,
    source_event_id: event.event_id,
    idempotency_key: `moderation:${event.event_type}:${event.event_id}`,
  }
}

export async function recordModerationMetricFromEvent(
  event: ClaimedOutboxEvent
): Promise<{
  status: "recorded" | "skipped"
  reason?: string
}> {
  const input = toModerationRollupInput(event)

  if (!input) {
    return {
      status: "skipped",
      reason: `not_moderation_event:${event.event_type}`,
    }
  }

  const { data, error } = await upsertTrustSafetyMetricRollup(input)

  if (error) {
    throw error
  }

  if (data) {
    await emitModerationMetricRecordedEvent({
      rollupId: data.rollup_id,
      periodStart: data.period_start,
      periodEnd: data.period_end,
      reportsReceived: Number(data.reports_received ?? 0),
      casesReviewed: Number(data.cases_reviewed ?? 0),
      actionsIssued: Number(data.actions_issued ?? 0),
      contentRemoved: Number(data.content_removed ?? 0),
      usersSuspended: Number(data.users_suspended ?? 0),
      sourceEventId: data.source_event_id,
      occurredAt: data.computed_at,
    })
  }

  return {
    status: "recorded",
  }
}
