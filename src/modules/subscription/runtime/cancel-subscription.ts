import { cancelSubscriptionByUserAndCreator } from "../repositories/subscription-write-repository"
import { revokeCreatorMembershipGrantNoThrow } from "@/modules/entitlement/public/access-grants"

type CancelSubscriptionInput = {
  userId: string
  creatorId: string
}

export async function cancelSubscription({
  userId,
  creatorId,
}: CancelSubscriptionInput) {
  const now = new Date().toISOString()

  const subscription = await cancelSubscriptionByUserAndCreator({
    userId,
    creatorId,
    canceledAt: now,
    updatedAt: now,
  })

  if (subscription) {
    await revokeCreatorMembershipGrantNoThrow({
      viewerUserId: subscription.user_id,
      creatorId: subscription.creator_id,
      subscriptionId: subscription.id,
      revokedAt: now,
      revokeReason: "subscription_canceled",
    })
  }

  return subscription
}
