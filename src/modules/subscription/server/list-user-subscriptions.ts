import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import {
  buildSubscriptionIdentity,
  buildSubscriptionReadModel,
  toSubscriptionDisplayStatus,
  type SubscriptionReadModelRow,
} from "@/modules/subscription/server/build-subscription-read-model"

type SubscriptionStatus = "incomplete" | "active" | "canceled" | "expired"

type CreatorRow = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

type SubscriptionRow = SubscriptionReadModelRow & {
  status: SubscriptionStatus
  creator: CreatorRow | CreatorRow[] | null
}

export type UserSubscriptionListItem = {
  id: string
  status: ReturnType<typeof toSubscriptionDisplayStatus>
  startedAt: string
  creator: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
}

export async function listUserSubscriptions(
  userId: string
): Promise<UserSubscriptionListItem[]> {
  const resolvedUserId = userId.trim()

  if (!resolvedUserId) {
    return []
  }

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
    .eq("user_id", resolvedUserId)
    .order("created_at", { ascending: false })
    .returns<SubscriptionRow[]>()

  if (error) {
    throw new Error("Failed to load subscriptions")
  }

  return (data ?? []).flatMap((row) => {
    const creator = Array.isArray(row.creator) ? row.creator[0] : row.creator

    if (!creator) {
      return []
    }

    const readModel = buildSubscriptionReadModel({
      id: row.id,
      user_id: row.user_id,
      creator_id: row.creator_id,
      status: row.status,
      current_period_start: row.current_period_start ?? null,
      current_period_end: row.current_period_end ?? null,
      cancel_at_period_end: row.cancel_at_period_end ?? false,
      canceled_at: row.canceled_at ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })

    return [
      {
        id: readModel.id,
        status: toSubscriptionDisplayStatus(readModel.state),
        startedAt: readModel.currentPeriodStartAt ?? readModel.createdAt,
        creator: buildSubscriptionIdentity(creator),
      },
    ]
  })
}
