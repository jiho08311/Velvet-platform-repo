import { listActiveSubscriptionCreatorIdsByUserId } from "@/modules/subscription/repositories/subscription-read-repository"

export async function listActiveSubscriptionCreatorIds(userId: string) {
  return listActiveSubscriptionCreatorIdsByUserId(userId)
}
