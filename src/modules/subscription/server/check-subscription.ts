import { getActiveSubscription } from "@/modules/subscription/server/get-active-subscription"
import { resolveSubscriptionState } from "@/modules/subscription/lib/resolve-subscription-state"

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

  if (!subscription) return false

  const resolved = resolveSubscriptionState({
    status: subscription.status,
    currentPeriodEndAt: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    canceledAt: subscription.canceledAt,
  })

  return resolved.hasAccess
}