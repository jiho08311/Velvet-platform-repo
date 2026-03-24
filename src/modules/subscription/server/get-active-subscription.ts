import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type SubscriptionStatus = "incomplete" | "active" | "canceled" | "expired"
type SubscriptionProvider = "toss" | "mock"

type SubscriptionRow = {
  id: string
  user_id: string
  creator_id: string
  status: SubscriptionStatus
  provider: SubscriptionProvider
  provider_subscription_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  canceled_at: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

type GetActiveSubscriptionInput = {
  userId: string
  creatorId: string
}

type ActiveSubscription = {
  id: string
  userId: string
  creatorId: string
  status: SubscriptionStatus
  provider: SubscriptionProvider
  providerSubscriptionId: string | null
  cancelAtPeriodEnd: boolean
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  canceledAt: string | null
  createdAt: string
  updatedAt: string
}

export async function getActiveSubscription({
  userId,
  creatorId,
}: GetActiveSubscriptionInput): Promise<ActiveSubscription | null> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select(
      "id, user_id, creator_id, status, provider, provider_subscription_id, cancel_at_period_end, current_period_start, current_period_end, canceled_at, created_at, updated_at"
    )
    .eq("user_id", userId)
    .eq("creator_id", creatorId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<SubscriptionRow>()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  if (data.current_period_end && new Date(data.current_period_end).getTime() <= Date.now()) {
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    creatorId: data.creator_id,
    status: data.status,
    provider: data.provider,
    providerSubscriptionId: data.provider_subscription_id,
    cancelAtPeriodEnd: data.cancel_at_period_end,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
    canceledAt: data.canceled_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}