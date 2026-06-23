import { findOwnedSubscriptionForUnsubscribe } from "../repositories/subscription-read-repository"

type GetOwnedSubscriptionForUnsubscribeInput = {
  subscriptionId: string
  userId: string
}

export async function getOwnedSubscriptionForUnsubscribe({
  subscriptionId,
  userId,
}: GetOwnedSubscriptionForUnsubscribeInput) {
  return findOwnedSubscriptionForUnsubscribe({
    subscriptionId,
    userId,
  })
}
