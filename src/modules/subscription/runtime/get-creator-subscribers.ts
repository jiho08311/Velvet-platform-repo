import { resolveSubscriptionState } from "@/modules/subscription/services/subscription-state-service"
import { listCreatorSubscriberRows } from "@/modules/subscription/repositories/subscription-read-repository"

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

  const data = await listCreatorSubscriberRows({
    creatorId,
    limit,
    cursor: input.cursor,
  })

  const rows = data.filter((row) => {
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
