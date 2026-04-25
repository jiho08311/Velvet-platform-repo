import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import {
  buildSubscriptionIdentity,
  buildSubscriptionReadModel,
  toSubscriptionDisplayStatus,
} from "@/modules/subscription/server/build-subscription-read-model"

type SubscriptionStatus =
  | "incomplete"
  | "active"
  | "canceled"
  | "expired"

type SubscriptionView = {
  id: string
  status: ReturnType<typeof toSubscriptionDisplayStatus>
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
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

type SubscriptionRow = {
  id: string
  user_id: string
  creator_id: string
  status: SubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end?: boolean | null
  canceled_at?: string | null
  created_at: string
  updated_at?: string
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
      user_id,
      creator_id,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      canceled_at,
      created_at,
      updated_at,
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

  const readModel = buildSubscriptionReadModel({
    id: data.id,
    user_id: data.user_id,
    creator_id: data.creator_id,
    status: data.status,
    current_period_start: data.current_period_start,
    current_period_end: data.current_period_end,
    cancel_at_period_end: data.cancel_at_period_end ?? false,
    canceled_at: data.canceled_at ?? null,
    created_at: data.created_at,
    updated_at: data.updated_at ?? data.created_at,
  })

  return {
    id: data.id,
    status: toSubscriptionDisplayStatus(readModel.state),
    startedAt: readModel.currentPeriodStartAt ?? readModel.createdAt,
    creator: buildSubscriptionIdentity(creatorData),
    billing: {
      renewalDate: readModel.currentPeriodEndAt,
      planLabel: "Monthly subscription",
      amountLabel: "Subscription",
    },
  }
}
