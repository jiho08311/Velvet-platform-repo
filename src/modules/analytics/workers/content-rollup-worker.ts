import type { ClaimedOutboxEvent } from "@/modules/events/contracts/claimed-outbox-event"
import {
  upsertContentMetricRollup,
  type UpsertContentMetricRollupInput,
} from "@/modules/analytics/repositories/content-metric-rollup-repository"
import { emitContentMetricRecordedEvent } from "@/modules/analytics/events/content-metric-recorded"

type ContentSourceEventType =
  | "PostPublished"
  | "PostLiked"
  | "CommentCreated"
  | "PostViewed"

type ContentEventPayload = {
  postId?: string
  contentId?: string
  commentId?: string
  creatorId?: string | null
  recipientUserId?: string | null
  occurredAt?: string
}

function isContentSourceEvent(
  eventType: string
): eventType is ContentSourceEventType {
  return (
    eventType === "PostPublished" ||
    eventType === "PostLiked" ||
    eventType === "CommentCreated" ||
    eventType === "PostViewed"
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

function calculateEngagementRate(input: {
  views: number
  likes: number
  comments: number
}): number {
  if (input.views <= 0) {
    return 0
  }

  return ((input.likes + input.comments) / input.views) * 100
}

function toContentRollupInput(
  event: ClaimedOutboxEvent
): UpsertContentMetricRollupInput | null {
  if (!isContentSourceEvent(event.event_type)) {
    return null
  }

  const payload = event.payload as ContentEventPayload

  const creatorId =
    readString(payload.creatorId) ??
    readString(payload.recipientUserId)

  if (!creatorId) {
    return null
  }

  const contentId =
    readString(payload.contentId) ??
    readString(payload.postId) ??
    (event.aggregate_type === "post" ? event.aggregate_id : null)

  const occurredAt =
    readString(payload.occurredAt) ?? new Date().toISOString()

  const views = event.event_type === "PostViewed" ? 1 : 0
  const likes = event.event_type === "PostLiked" ? 1 : 0
  const comments = event.event_type === "CommentCreated" ? 1 : 0

  return {
    content_id: contentId,
    creator_id: creatorId,
    period_start: dayStart(occurredAt),
    period_end: dayEnd(occurredAt),
    views,
    likes,
    comments,
    engagement_rate: calculateEngagementRate({
      views,
      likes,
      comments,
    }),
    source_event_id: event.event_id,
    idempotency_key: `content:${event.event_type}:${event.event_id}`,
  }
}

export async function recordContentMetricFromEvent(
  event: ClaimedOutboxEvent
): Promise<{
  status: "recorded" | "skipped"
  reason?: string
}> {
  const input = toContentRollupInput(event)

  if (!input) {
    return {
      status: "skipped",
      reason: `not_content_event:${event.event_type}`,
    }
  }

  const { data, error } = await upsertContentMetricRollup(input)

  if (error) {
    throw error
  }

  if (data) {
    await emitContentMetricRecordedEvent({
      rollupId: data.rollup_id,
      contentId: data.content_id,
      creatorId: data.creator_id,
      periodStart: data.period_start,
      periodEnd: data.period_end,
      views: Number(data.views ?? 0),
      likes: Number(data.likes ?? 0),
      comments: Number(data.comments ?? 0),
      engagementRate: Number(data.engagement_rate ?? 0),
      sourceEventId: data.source_event_id,
      occurredAt: data.computed_at,
    })
  }

  return {
    status: "recorded",
  }
}
