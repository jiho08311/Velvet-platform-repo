import { upsertSubscription } from "@/modules/subscription/public/upsert-subscription"
import {
  emitSubscriptionStartedNotificationEvent,
} from "@/modules/subscription/public/subscription-domain-events"
import { readCreatorIdentityByCreatorId } from "@/modules/identity/public/creator-identity-read-model"
import { getViewerSubscription } from "@/modules/subscription/public/get-viewer-subscription"

export async function handleSubscriptionCreated({
  userId,
  creatorId,
}: {
  userId: string
  creatorId: string
}) {
  const existingSubscription = await getViewerSubscription(userId, creatorId)
  const hasExistingAccessSubscription = existingSubscription.isActive

  const subscription = await upsertSubscription({
    userId,
    creatorId,
    status: "active",
  })

  if (!hasExistingAccessSubscription) {
    const creator = await readCreatorIdentityByCreatorId(creatorId)

    if (creator?.userId) {
       await emitSubscriptionStartedNotificationEvent({
        subscriptionId: subscription.id,
        userId,
        creatorId,
        recipientUserId: creator.userId,
      })
    }
  }

  return subscription
}
