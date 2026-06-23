import {
  countActiveSubscriptionsByCreatorId,
  countSubscriptionsByCreatorId,
} from "@/modules/subscription/repositories/subscription-read-repository"

export async function countCreatorSubscriptions(creatorId: string) {
  return countSubscriptionsByCreatorId(creatorId)
}

export async function countCreatorActiveSubscriptions(creatorId: string) {
  return countActiveSubscriptionsByCreatorId(creatorId)
}
