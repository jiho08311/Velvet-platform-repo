import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type SubscriptionRow = {
  id: string
  user_id: string
  creator_id: string
  status:
    | "incomplete"
    | "active"
    | "trialing"
    | "past_due"
    | "canceled"
    | "expired"
  provider: "toss" | "mock"
  provider_subscription_id: string | null
  cancel_at_period_end: boolean | null
  current_period_start: string | null
  current_period_end: string | null
  canceled_at: string | null
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
  status:
    | "incomplete"
    | "active"
    | "trialing"
    | "past_due"
    | "canceled"
    | "expired"
  provider: "toss" | "mock"
  providerSubscriptionId?: string
  cancelAtPeriodEnd: boolean
  currentPeriodStart?: string
  currentPeriodEnd?: string
  canceledAt?: string
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
    .in("status", ["active", "trialing", "past_due"])
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  const row = data as SubscriptionRow

  return {
    id: row.id,
    userId: row.user_id,
    creatorId: row.creator_id,
    status: row.status,
    provider: row.provider,
    providerSubscriptionId: row.provider_subscription_id ?? undefined,
    cancelAtPeriodEnd: row.cancel_at_period_end ?? false,
    currentPeriodStart: row.current_period_start ?? undefined,
    currentPeriodEnd: row.current_period_end ?? undefined,
    canceledAt: row.canceled_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}