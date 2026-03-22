import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type SubscriptionStatus = "active" | "canceled" | "expired"

type SubscriptionView = {
  id: string
  status: SubscriptionStatus
  startedAt: string
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

type SubscriptionRow = {
  id: string
  status: SubscriptionStatus
  started_at: string
  renewal_date: string | null
  price_cents: number
  currency: string
  creator_id: string
}

type CreatorRow = {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
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
      started_at,
      renewal_date,
      price_cents,
      currency,
      creator:creators(
        id,
        username,
        display_name,
        avatar_url
      )
    `
    )
    .eq("id", subscriptionId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  const creator = data.creator as unknown as CreatorRow

  return {
    id: data.id,
    status: data.status,
    startedAt: data.started_at,
    creator: {
      id: creator.id,
      username: creator.username,
      displayName: creator.display_name,
      avatarUrl: creator.avatar_url,
    },
    billing: {
      renewalDate: data.renewal_date,
      planLabel: "Monthly subscription",
      amountLabel: `$${(data.price_cents / 100).toFixed(2)} / month`,
    },
  }
} 