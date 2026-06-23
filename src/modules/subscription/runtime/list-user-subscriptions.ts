import { listSubscriptionsWithCreatorByUserId } from "@/modules/subscription/repositories/subscription-read-repository"
import {
  buildSubscriptionIdentity,
  buildSubscriptionReadModel,
  toSubscriptionDisplayStatus,
} from "@/modules/subscription/mappers/build-subscription-read-model"

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

  let data

  try {
    data = await listSubscriptionsWithCreatorByUserId(resolvedUserId)
  } catch {
    throw new Error("Failed to load subscriptions")
  }

  return data.flatMap((row) => {
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
