import { unsubscribeById } from "../repositories/subscription-write-repository"
import { revokeCreatorMembershipGrantNoThrow } from "@/modules/entitlement/public/access-grants"

export async function unsubscribe(subscriptionId: string) {
  const now = new Date().toISOString()

  const subscription = await unsubscribeById({
    subscriptionId,
    canceledAt: now,
    updatedAt: now,
  })

  if (subscription) {
    await revokeCreatorMembershipGrantNoThrow({
      viewerUserId: subscription.user_id,
      creatorId: subscription.creator_id,
      subscriptionId: subscription.id,
      revokedAt: now,
      revokeReason: "subscription_unsubscribed",
    })
  }

  return subscription
}
