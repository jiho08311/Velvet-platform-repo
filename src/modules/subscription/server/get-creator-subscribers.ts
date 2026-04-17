import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { resolveSubscriptionState } from "@/modules/subscription/lib/resolve-subscription-state"

export type CreatorSubscriber = {
  subscriptionId: string
  viewerUserId: string
  username: string
  displayName: string
  avatarUrl: string | null
  subscribedAt: string
}

export type GetCreatorSubscribersInput = {
  creatorId: string
  status?: "active"
  limit?: number
  cursor?: string | null
}

export type GetCreatorSubscribersResult = {
  items: CreatorSubscriber[]
  nextCursor: string | null
}

type SubscriptionRow = {
  id: string
  user_id: string
  created_at: string
  status: "incomplete" | "active" | "canceled" | "expired"
  current_period_end: string | null
  cancel_at_period_end: boolean | null
  canceled_at: string | null
  profiles: {
    username: string | null
    display_name: string | null
    avatar_url: string | null
  } | null
}

export async function getCreatorSubscribers(
  input: GetCreatorSubscribersInput
): Promise<GetCreatorSubscribersResult> {
  const creatorId = input.creatorId.trim()

  if (!creatorId) {
    throw new Error("Creator id is required")
  }

  const limit = Math.max(1, Math.min(input.limit ?? 20, 100))

let query = supabaseAdmin
  .from("subscriptions")
  .select(
    `
    id,
    user_id,
    created_at,
    status,
    current_period_end,
    cancel_at_period_end,
    canceled_at,
    profiles:user_id (
      username,
      display_name,
      avatar_url
    )
  `
  )
  .eq("creator_id", creatorId)
  .order("created_at", { ascending: false })
  .limit(limit + 20)

if (input.cursor) {
  query = query.lt("created_at", input.cursor)
}

const { data, error } = await query.returns<SubscriptionRow[]>()

  if (error) {
    throw error
  }

  const rows = (data ?? []).filter((row) => {
    const resolved = resolveSubscriptionState({
      status: row.status,
      currentPeriodEndAt: row.current_period_end,
      cancelAtPeriodEnd: row.cancel_at_period_end,
      canceledAt: row.canceled_at,
    })

    return resolved.hasAccess
  })

  const sliced = rows.slice(0, limit)

  const items: CreatorSubscriber[] = sliced.map((row) => ({
    subscriptionId: row.id,
    viewerUserId: row.user_id,
    username: row.profiles?.username ?? "",
    displayName: row.profiles?.display_name ?? "",
    avatarUrl: row.profiles?.avatar_url ?? null,
    subscribedAt: row.created_at,
  }))

const nextCursor =
  rows.length > limit && sliced.length > 0
    ? sliced[sliced.length - 1].created_at
    : null

  return {
    items,
    nextCursor,
  }
}