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
  cancelledAt: string | null
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
    .returns<SubscriptionRow[]>()

  if (error) {
    throw error
  }

  const rows = data ?? []
  const now = new Date()

  const activeRow =
    rows.find((row) => {
      if (!row.current_period_end) {
        return false
      }

      return new Date(row.current_period_end) > now
    }) ?? null

  if (!activeRow) {
    return null
  }

  return {
    id: activeRow.id,
    userId: activeRow.user_id,
    creatorId: activeRow.creator_id,
    status: activeRow.status,
    provider: activeRow.provider,
    providerSubscriptionId: activeRow.provider_subscription_id,
    cancelAtPeriodEnd: activeRow.cancel_at_period_end,
    currentPeriodStart: activeRow.current_period_start,
    currentPeriodEnd: activeRow.current_period_end,
    cancelledAt: activeRow.canceled_at,
    createdAt: activeRow.created_at,
    updatedAt: activeRow.updated_at,
  }
}