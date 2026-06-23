import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { upsertAnalyticsRollup } from "@/modules/analytics/repositories/analytics-rollup-repository"
import {
  buildCreatorLifetimeRollups,
  buildPlatformDailyRollups,
} from "./build-analytics-rollups"

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

export async function rebuildAnalyticsRollups(input?: {
  limit?: number
  dryRun?: boolean
}) {
  const limit = Math.max(1, Math.min(input?.limit ?? 5000, 10000))

  const [
    { data: payments, error: paymentsError },
    { data: subscriptions, error: subscriptionsError },
    { data: contents, error: contentsError },
  ] = await Promise.all([
    supabaseAdmin
      .from("canonical_payment_state")
      .select("id, creator_id, user_id, amount, status, created_at, updated_at")
      .limit(limit)
      .returns<PaymentRow[]>(),
    supabaseAdmin
      .from("canonical_subscription_state")
      .select("id, creator_id, user_id, status, created_at, updated_at")
      .limit(limit)
      .returns<SubscriptionRow[]>(),
    supabaseAdmin
      .from("canonical_feed_items")
      .select("post_id, creator_id, status, visibility, is_feed_visible, published_at, created_at")
      .limit(limit)
      .returns<ContentRow[]>(),
  ])

  if (paymentsError) throw paymentsError
  if (subscriptionsError) throw subscriptionsError
  if (contentsError) throw contentsError

  const rollups = [
    ...buildPlatformDailyRollups({
      payments: payments ?? [],
      subscriptions: subscriptions ?? [],
      contents: contents ?? [],
    }),
    ...buildCreatorLifetimeRollups({
      payments: payments ?? [],
      subscriptions: subscriptions ?? [],
      contents: contents ?? [],
    }),
  ]

  let upsertedCount = 0
  let failedCount = 0

  for (const rollup of rollups) {
    try {
      if (!input?.dryRun) {
        const { error } = await upsertAnalyticsRollup(rollup)
        if (error) throw error
      }

      upsertedCount += 1
    } catch {
      failedCount += 1
    }
  }

  return {
    scannedPaymentCount: payments?.length ?? 0,
    scannedSubscriptionCount: subscriptions?.length ?? 0,
    scannedContentCount: contents?.length ?? 0,
    rollupCount: rollups.length,
    upsertedCount,
    failedCount,
  }
}
