import { cancelSubscription } from "@/modules/subscription/public/cancel-subscription"
import { getSubscriptionParityById } from "@/modules/subscription/public/get-subscription-parity-by-id"

export async function getCanonicalSubscriptionById(subscriptionId: string) {
  return getSubscriptionParityById(subscriptionId)
}

export async function cancelCanonicalSubscription(input: {
  subscriberUserId: string
  creatorId: string
}) {
  return cancelSubscription({
    userId: input.subscriberUserId,
    creatorId: input.creatorId,
  })
}
