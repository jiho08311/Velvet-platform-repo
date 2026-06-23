import { listSubscriptionReadModelRowsByUserId } from "@/modules/subscription/repositories/subscription-read-repository"

export async function listUserSubscriptionReadModelRows(userId: string) {
  return listSubscriptionReadModelRowsByUserId(userId)
}
