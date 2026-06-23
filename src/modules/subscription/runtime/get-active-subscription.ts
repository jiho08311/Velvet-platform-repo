import {
  findLatestAccessibleByUserAndCreator,
} from "@/modules/subscription/repositories/subscription-read-repository"
import { findLatestAccessibleSubscriptionReadModel } from "@/modules/subscription/mappers/build-subscription-read-model"

type SubscriptionStatus = "incomplete" | "active" | "canceled" | "expired"
type SubscriptionProvider = "toss" | "mock"

type GetActiveSubscriptionInput = {
  userId: string
  creatorId: string
}

type ActiveSubscription = {
  id: string
  userId: string
  creatorId: string
  status: SubscriptionStatus
  provider: SubscriptionProvider
  providerSubscriptionId: string | null
  cancelAtPeriodEnd: boolean
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  canceledAt: string | null
  createdAt: string
  updatedAt: string
}

export async function getActiveSubscription({
  userId,
  creatorId,
}: GetActiveSubscriptionInput): Promise<ActiveSubscription | null> {
  const resolvedUserId = userId.trim()
  const resolvedCreatorId = creatorId.trim()

  if (!resolvedUserId || !resolvedCreatorId) {
    return null
  }

  const rows = await findLatestAccessibleByUserAndCreator({
    userId: resolvedUserId,
    creatorId: resolvedCreatorId,
  })

  const activeReadModel = findLatestAccessibleSubscriptionReadModel(rows)

  if (!activeReadModel) {
    return null
  }

  const activeRow = rows.find((row) => row.id === activeReadModel.id) ?? null

  if (!activeRow) {
    return null
  }

  return {
    id: activeRow.id,
    userId: activeRow.user_id,
    creatorId: activeRow.creator_id,
    status: activeRow.status,
    provider: activeRow.provider,
    providerSubscriptionId: activeRow.provider_subscription_id,
    cancelAtPeriodEnd: activeRow.cancel_at_period_end,
    currentPeriodStart: activeRow.current_period_start ?? null,
    currentPeriodEnd: activeRow.current_period_end ?? null,
    canceledAt: activeRow.canceled_at ?? null,
    createdAt: activeRow.created_at,
    updatedAt: activeRow.updated_at,
  }
}
