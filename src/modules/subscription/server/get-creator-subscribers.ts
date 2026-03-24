import { supabaseAdmin } from "@/infrastructure/supabase/admin"

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
      profiles:user_id (
        username,
        display_name,
        avatar_url
      )
    `
    )
    .eq("creator_id", creatorId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit + 1)

  if (input.cursor) {
    query = query.lt("created_at", input.cursor)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  const rows = data ?? []

  const hasNext = rows.length > limit
  const sliced = hasNext ? rows.slice(0, limit) : rows

  const items: CreatorSubscriber[] = sliced.map((row: any) => ({
    subscriptionId: row.id,
    viewerUserId: row.user_id,
    username: row.profiles?.username ?? "",
    displayName: row.profiles?.display_name ?? "",
    avatarUrl: row.profiles?.avatar_url ?? null,
    subscribedAt: row.created_at,
  }))

  const nextCursor =
    hasNext && sliced.length > 0
      ? sliced[sliced.length - 1].created_at
      : null

  return {
    items,
    nextCursor,
  }
}