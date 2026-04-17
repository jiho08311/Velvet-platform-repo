import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { resolveSubscriptionState } from "@/modules/subscription/lib/resolve-subscription-state"

type SubscriptionStatus =
  | "incomplete"
  | "active"
  | "canceled"
  | "expired"

type SubscriptionDisplayStatus =
  | "active"
  | "canceled"
  | "expired"
  | "inactive"

type SubscriptionView = {
  id: string
  status: SubscriptionDisplayStatus
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
  cancel_at_period_end?: boolean | null
  canceled_at?: string | null
  creator: CreatorRow | CreatorRow[] | null
}

function toDisplayStatus(
  status: ReturnType<typeof resolveSubscriptionState>["displayState"]
): SubscriptionDisplayStatus {
  if (status === "ending") {
    return "canceled"
  }

  return status
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
      cancel_at_period_end,
      canceled_at,
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

  const resolved = resolveSubscriptionState({
    status: data.status,
    currentPeriodEndAt: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
    canceledAt: data.canceled_at ?? null,
  })

  return {
    id: data.id,
    status: toDisplayStatus(resolved.displayState),
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