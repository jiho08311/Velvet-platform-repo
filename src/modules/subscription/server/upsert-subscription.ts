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

function addOneMonth(dateString: string): string {
  const date = new Date(dateString)
  date.setMonth(date.getMonth() + 1)
  return date.toISOString()
}

export async function upsertSubscription({
  userId,
  creatorId,
  status = "active",
  provider = "toss",
  providerSubscriptionId,
  currentPeriodStart,
  currentPeriodEnd,
  cancelAtPeriodEnd = false,
}: UpsertSubscriptionInput) {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("subscriptions")
    .select(
      "id, user_id, creator_id, status, provider, provider_subscription_id, current_period_start, current_period_end, canceled_at, cancel_at_period_end, created_at, updated_at"
    )
    .eq("user_id", userId)
    .eq("creator_id", creatorId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle<SubscriptionRow>()

  if (existingError) {
    throw existingError
  }

  const now = new Date().toISOString()

  let resolvedCurrentPeriodStart = currentPeriodStart ?? now
  let resolvedCurrentPeriodEnd = currentPeriodEnd ?? null

  if (status === "active") {
    if (currentPeriodStart && currentPeriodEnd) {
      resolvedCurrentPeriodStart = currentPeriodStart
      resolvedCurrentPeriodEnd = currentPeriodEnd
    } else if (
      existing?.current_period_end &&
      new Date(existing.current_period_end).getTime() > Date.now()
    ) {
      resolvedCurrentPeriodStart = existing.current_period_end
      resolvedCurrentPeriodEnd = addOneMonth(existing.current_period_end)
    } else {
      resolvedCurrentPeriodStart = now
      resolvedCurrentPeriodEnd = addOneMonth(now)
    }
  }

  const canceledAt = status === "canceled" ? now : null

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status,
        provider,
        provider_subscription_id:
          providerSubscriptionId ?? existing.provider_subscription_id,
        current_period_start: resolvedCurrentPeriodStart,
        current_period_end: resolvedCurrentPeriodEnd,
        canceled_at: canceledAt,
        cancel_at_period_end: cancelAtPeriodEnd,
        updated_at: now,
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
      current_period_start: resolvedCurrentPeriodStart,
      current_period_end: resolvedCurrentPeriodEnd,
      canceled_at: canceledAt,
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