import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { upsertAudienceMetricRollup } from "@/modules/analytics/repositories/audience-metric-rollup-repository"

type SubscriptionRow = {
  id: string
  creator_id: string | null
  user_id: string | null
  status: string | null
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string | null
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

function isActiveSubscription(status: string | null): boolean {
  return status === "active"
}

function isChurnedSubscription(status: string | null): boolean {
  return (
    status === "cancelled" ||
    status === "canceled" ||
    status === "expired" ||
    status === "inactive"
  )
}

function occurredAtForSubscription(subscription: SubscriptionRow): string {
  return (
    subscription.current_period_start ??
    subscription.created_at ??
    new Date().toISOString()
  )
}

export async function rebuildAudienceRollups(input?: {
  dryRun?: boolean
  limit?: number
}) {
  const limit = Math.max(1, Math.min(input?.limit ?? 5000, 10000))

  const { data, error } = await supabaseAdmin
    .from("canonical_subscription_state")
    .select(
      [
        "id",
        "creator_id",
        "user_id",
        "status",
        "current_period_start",
        "current_period_end",
        "created_at",
        "updated_at",
      ].join(", ")
    )
    .limit(limit)
    .returns<SubscriptionRow[]>()

  if (error) {
    throw error
  }

  const subscriptions = data ?? []

  let upsertedCount = 0
  let skippedCount = 0
  let failedCount = 0

  for (const subscription of subscriptions) {
    if (!subscription.creator_id) {
      skippedCount += 1
      continue
    }

    const occurredAt = occurredAtForSubscription(subscription)
    const active = isActiveSubscription(subscription.status)
    const churned = isChurnedSubscription(subscription.status)

    try {
      if (!input?.dryRun) {
        const { error: upsertError } = await upsertAudienceMetricRollup({
          creator_id: subscription.creator_id,
          period_start: dayStart(occurredAt),
          period_end: dayEnd(occurredAt),
          subscriber_count: 1,
          active_subscribers: active ? 1 : 0,
          new_subscribers: 1,
          churned_subscribers: churned ? 1 : 0,
          source_event_id: null,
          idempotency_key: `audience:rebuild:subscription:${subscription.id}`,
        })

        if (upsertError) {
          throw upsertError
        }
      }

      upsertedCount += 1
    } catch {
      failedCount += 1
    }
  }

  return {
    scannedSubscriptionCount: subscriptions.length,
    upsertedCount,
    skippedCount,
    failedCount,
  }
}