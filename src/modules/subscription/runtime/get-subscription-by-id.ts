import { findSubscriptionWithCreatorById } from "@/modules/subscription/repositories/subscription-read-repository"
import {
  buildSubscriptionIdentity,
  buildSubscriptionReadModel,
  toSubscriptionDisplayStatus,
} from "@/modules/subscription/mappers/build-subscription-read-model"

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

export async function getSubscriptionById(
  subscriptionId: string
): Promise<SubscriptionView | null> {
  const data = await findSubscriptionWithCreatorById(subscriptionId)

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
