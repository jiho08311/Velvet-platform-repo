import {
  expireActiveSubscriptionsByUserAndCreator,
  expireSubscriptionsByCreatorIds,
  expireSubscriptionsByUserId,
} from "@/modules/subscription/repositories/subscription-write-repository"
import { revokeCreatorMembershipGrantNoThrow } from "@/modules/entitlement/public/access-grants"

async function revokeExpiredMembershipGrants(
  subscriptions: Array<{
    id: string
    user_id: string
    creator_id: string
  }>,
  revokedAt: string,
  revokeReason: string
) {
  await Promise.all(
    subscriptions.map((subscription) =>
      revokeCreatorMembershipGrantNoThrow({
        viewerUserId: subscription.user_id,
        creatorId: subscription.creator_id,
        subscriptionId: subscription.id,
        revokedAt,
        revokeReason,
      })
    )
  )
}

export async function expireActiveCreatorSubscription(input: {
  userId: string
  creatorId: string
  canceledAt: string
  updatedAt: string
}) {
  const subscriptions = await expireActiveSubscriptionsByUserAndCreator(input)

  await revokeExpiredMembershipGrants(
    subscriptions,
    input.updatedAt,
    "subscription_expired"
  )

  return subscriptions
}

export async function expireCreatorSubscriptions(input: {
  creatorIds: string[]
  canceledAt: string
}) {
  const subscriptions = await expireSubscriptionsByCreatorIds(input)

  await revokeExpiredMembershipGrants(
    subscriptions,
    input.canceledAt,
    "creator_subscriptions_expired"
  )

  return subscriptions
}

export async function expireUserSubscriptions(input: {
  userId: string
  canceledAt: string
}) {
  const subscriptions = await expireSubscriptionsByUserId(input)

  await revokeExpiredMembershipGrants(
    subscriptions,
    input.canceledAt,
    "user_subscriptions_expired"
  )

  return subscriptions
}
