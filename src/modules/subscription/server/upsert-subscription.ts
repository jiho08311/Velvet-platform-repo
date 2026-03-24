import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type SubscriptionStatus = "incomplete" | "active" | "canceled" | "expired"
type SubscriptionProvider = "toss" | "mock"

type UpsertSubscriptionInput = {
  userId: string
  creatorId: string
  status?: SubscriptionStatus
  provider?: SubscriptionProvider
  providerSubscriptionId?: string
  currentPeriodStart?: string | null
  currentPeriodEnd?: string | null
  cancelAtPeriodEnd?: boolean
}

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
  cancel_at_period_end: boolean | null
  created_at: string
  updated_at: string
}

export async function upsertSubscription({
  userId,
  creatorId,
  status = "active",
  provider = "toss",
  providerSubscriptionId,
  currentPeriodStart = new Date().toISOString(),
  currentPeriodEnd = null,
  cancelAtPeriodEnd = false,
}: UpsertSubscriptionInput) {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("subscriptions")
    .select(
      "id, user_id, creator_id, status, provider, provider_subscription_id, current_period_start, current_period_end, canceled_at, cancel_at_period_end, created_at, updated_at"
    )
    .eq("user_id", userId)
    .eq("creator_id", creatorId)
    .limit(1)
    .maybeSingle<SubscriptionRow>()

  if (existingError) {
    throw existingError
  }

  const cancelledAt = status === "canceled" ? new Date().toISOString() : null

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status,
        provider,
        provider_subscription_id:
          providerSubscriptionId ?? existing.provider_subscription_id,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        canceled_at: cancelledAt,
        cancel_at_period_end: cancelAtPeriodEnd,
      })
      .eq("id", existing.id)
      .select(
        "id, user_id, creator_id, status, provider, provider_subscription_id, current_period_start, current_period_end, canceled_at, cancel_at_period_end, created_at, updated_at"
      )
      .single<SubscriptionRow>()

    if (error) {
      throw error
    }

    return data
  }

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .insert({
      user_id: userId,
      creator_id: creatorId,
      status,
      provider,
      provider_subscription_id: providerSubscriptionId ?? null,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      canceled_at: cancelledAt,
      cancel_at_period_end: cancelAtPeriodEnd,
    })
    .select(
      "id, user_id, creator_id, status, provider, provider_subscription_id, current_period_start, current_period_end, canceled_at, cancel_at_period_end, created_at, updated_at"
    )
    .single<SubscriptionRow>()

  if (error) {
    throw error
  }

  return data
}