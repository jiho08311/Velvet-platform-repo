import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type SubscriptionStatus =
  | "incomplete"
  | "active"
  | "canceled"
  | "expired"

type SubscriptionView = {
  id: string
  status: SubscriptionStatus
  startedAt: string | null
  creator: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
  billing: {
    renewalDate: string | null
    planLabel: string
    amountLabel: string
  }
}

type CreatorRow = {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
}

type SubscriptionRow = {
  id: string
  status: SubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
  creator: CreatorRow | CreatorRow[] | null
}

export async function getSubscriptionById(
  subscriptionId: string
): Promise<SubscriptionView | null> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select(
      `
      id,
      status,
      current_period_start,
      current_period_end,
      creator:creators(
        id,
        username,
        display_name,
        avatar_url
      )
    `
    )
    .eq("id", subscriptionId)
    .maybeSingle<SubscriptionRow>()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  const creatorData = Array.isArray(data.creator) ? data.creator[0] : data.creator

  if (!creatorData) {
    return null
  }

  return {
    id: data.id,
    status: data.status,
    startedAt: data.current_period_start,
    creator: {
      id: creatorData.id,
      username: creatorData.username,
      displayName: creatorData.display_name,
      avatarUrl: creatorData.avatar_url,
    },
    billing: {
      renewalDate: data.current_period_end,
      planLabel: "Monthly subscription",
      amountLabel: "Subscription",
    },
  }
}