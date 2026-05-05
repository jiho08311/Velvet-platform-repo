import { resolveSubscriptionState } from "@/modules/subscription/lib/resolve-subscription-state"
import { findLatestViewerSubscriptionByUserAndCreator } from "@/modules/subscription/repositories/subscription-read-repository"

type IsSubscribedInput = {
  userId: string
  creatorId: string
}

export async function isSubscribed({
  userId,
  creatorId,
}: IsSubscribedInput): Promise<boolean> {
  const row = await findLatestViewerSubscriptionByUserAndCreator({
    userId,
    creatorId,
  })

  if (!row) {
    return false
  }

  const resolved = resolveSubscriptionState({
    status: row.status,
    currentPeriodEndAt: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    canceledAt: row.canceled_at,
  })

  return resolved.hasAccess
}