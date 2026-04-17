import { getActiveSubscription } from "@/modules/subscription/server/get-active-subscription"

export async function checkSubscription({
  userId,
  creatorId,
}: {
  userId: string
  creatorId: string
}): Promise<boolean> {
  const subscription = await getActiveSubscription({
    userId,
    creatorId,
  })

  return subscription !== null
}