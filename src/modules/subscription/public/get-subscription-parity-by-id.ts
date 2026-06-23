import {
  findSubscriptionWithCreatorById,
} from "@/modules/subscription/repositories/subscription-read-repository"

export const PUBLIC_CONTRACT = true

export type SubscriptionParityReadModel = Awaited<
  ReturnType<typeof findSubscriptionWithCreatorById>
>

export async function getSubscriptionParityById(subscriptionId: string) {
  return findSubscriptionWithCreatorById(subscriptionId)
}
