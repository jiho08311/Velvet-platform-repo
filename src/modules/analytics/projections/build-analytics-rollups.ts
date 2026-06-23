import { createHash } from "node:crypto"
import type { UpsertAnalyticsRollupInput } from "@/modules/analytics/repositories/analytics-rollup-repository"

type PaymentRow = {
  id: string
  creator_id: string | null
  user_id: string | null
  amount: number | null
  status: string | null
  created_at: string
  updated_at?: string | null
}

type SubscriptionRow = {
  id: string
  creator_id: string
  user_id: string
  status: string | null
  created_at: string
  updated_at?: string | null
}

type ContentRow = {
  post_id: string
  creator_id: string
  status: string | null
  visibility: string | null
  is_feed_visible: boolean | null
  published_at: string | null
  created_at: string
}

function buildRollupKey(input: {
  rollupType: string
  subjectType: string
  subjectId: string | null
  windowStart: string | null
  windowEnd: string | null
}) {
  return [
    input.rollupType,
    input.subjectType,
    input.subjectId ?? "platform",
    input.windowStart ?? "lifetime",
    input.windowEnd ?? "lifetime",
  ].join(":")
}

function hashSource(value: unknown) {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")
}

function dayStart(value: string) {
  const date = new Date(value)
  date.setUTCHours(0, 0, 0, 0)
  return date.toISOString()
}

function dayEnd(value: string) {
  const date = new Date(value)
  date.setUTCHours(23, 59, 59, 999)
  return date.toISOString()
}

function addMetric(
  map: Map<string, Record<string, number>>,
  key: string,
  metric: string,
  amount = 1
) {
  const current = map.get(key) ?? {}
  current[metric] = (current[metric] ?? 0) + amount
  map.set(key, current)
}

export function buildPlatformDailyRollups(input: {
  payments: PaymentRow[]
  subscriptions: SubscriptionRow[]
  contents: ContentRow[]
}): UpsertAnalyticsRollupInput[] {
  const metricsByDay = new Map<string, Record<string, number>>()

  for (const payment of input.payments) {
    const key = dayStart(payment.created_at)
    addMetric(metricsByDay, key, "payment_count", 1)

    if (payment.status === "succeeded") {
      addMetric(metricsByDay, key, "succeeded_payment_count", 1)
      addMetric(metricsByDay, key, "succeeded_payment_amount", payment.amount ?? 0)
    }
  }

  for (const subscription of input.subscriptions) {
    const key = dayStart(subscription.created_at)
    addMetric(metricsByDay, key, "subscription_count", 1)

    if (subscription.status === "active") {
      addMetric(metricsByDay, key, "active_subscription_count", 1)
    }
  }

  for (const content of input.contents) {
    const key = dayStart(content.published_at ?? content.created_at)
    addMetric(metricsByDay, key, "content_count", 1)

    if (content.status === "published") {
      addMetric(metricsByDay, key, "published_content_count", 1)
    }

    if (content.is_feed_visible) {
      addMetric(metricsByDay, key, "feed_visible_content_count", 1)
    }
  }

  return Array.from(metricsByDay.entries()).map(([windowStart, metrics]) => {
    const windowEnd = dayEnd(windowStart)

    return {
      rollup_key: buildRollupKey({
        rollupType: "daily",
        subjectType: "platform",
        subjectId: null,
        windowStart,
        windowEnd,
      }),
      rollup_type: "daily",
      subject_type: "platform",
      subject_id: null,
      window_start: windowStart,
      window_end: windowEnd,
      metrics,
      source_hash: hashSource({ windowStart, windowEnd, metrics }),
      projection_version: 1,
    }
  })
}

export function buildCreatorLifetimeRollups(input: {
  payments: PaymentRow[]
  subscriptions: SubscriptionRow[]
  contents: ContentRow[]
}): UpsertAnalyticsRollupInput[] {
  const metricsByCreator = new Map<string, Record<string, number>>()

  for (const payment of input.payments) {
    if (!payment.creator_id) continue

    addMetric(metricsByCreator, payment.creator_id, "payment_count", 1)

    if (payment.status === "succeeded") {
      addMetric(metricsByCreator, payment.creator_id, "succeeded_payment_count", 1)
      addMetric(metricsByCreator, payment.creator_id, "succeeded_payment_amount", payment.amount ?? 0)
    }
  }

  for (const subscription of input.subscriptions) {
    addMetric(metricsByCreator, subscription.creator_id, "subscription_count", 1)

    if (subscription.status === "active") {
      addMetric(metricsByCreator, subscription.creator_id, "active_subscription_count", 1)
    }
  }

  for (const content of input.contents) {
    addMetric(metricsByCreator, content.creator_id, "content_count", 1)

    if (content.status === "published") {
      addMetric(metricsByCreator, content.creator_id, "published_content_count", 1)
    }

    if (content.is_feed_visible) {
      addMetric(metricsByCreator, content.creator_id, "feed_visible_content_count", 1)
    }
  }

  return Array.from(metricsByCreator.entries()).map(([creatorId, metrics]) => ({
    rollup_key: buildRollupKey({
      rollupType: "lifetime",
      subjectType: "creator",
      subjectId: creatorId,
      windowStart: null,
      windowEnd: null,
    }),
    rollup_type: "lifetime",
    subject_type: "creator",
    subject_id: creatorId,
    window_start: null,
    window_end: null,
    metrics,
    source_hash: hashSource({ creatorId, metrics }),
    projection_version: 1,
  }))
}
