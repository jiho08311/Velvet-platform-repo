import {
  findActiveSubscriptionForUpsert,
  insertSubscriptionForUpsert,
  type SubscriptionProvider,
  type SubscriptionStatus,
  updateSubscriptionForUpsert,
} from "@/modules/subscription/repositories/subscription-write-repository"
import { issueCreatorMembershipGrantNoThrow } from "@/modules/entitlement/public/access-grants"

type UpsertSubscriptionInput = {
  userId: string
  creatorId: string
  status?: SubscriptionStatus
  provider?: SubscriptionProvider
  providerSubscriptionId?: string
  currentPeriodStart?: string | null
  currentPeriodEnd?: string | null
  cancelAtPeriodEnd?: boolean
}

function addOneMonth(dateString: string): string {
  const date = new Date(dateString)
  date.setMonth(date.getMonth() + 1)
  return date.toISOString()
}

export async function upsertSubscription({
  userId,
  creatorId,
  status = "active",
  provider = "toss",
  providerSubscriptionId,
  currentPeriodStart,
  currentPeriodEnd,
  cancelAtPeriodEnd = false,
}: UpsertSubscriptionInput) {
  const existing = await findActiveSubscriptionForUpsert({
    userId,
    creatorId,
  })

  const now = new Date().toISOString()

  let resolvedCurrentPeriodStart = currentPeriodStart ?? now
  let resolvedCurrentPeriodEnd = currentPeriodEnd ?? null

  if (status === "active") {
    if (currentPeriodStart && currentPeriodEnd) {
      resolvedCurrentPeriodStart = currentPeriodStart
      resolvedCurrentPeriodEnd = currentPeriodEnd
    } else if (
      existing?.current_period_end &&
      new Date(existing.current_period_end).getTime() > Date.now()
    ) {
      resolvedCurrentPeriodStart = existing.current_period_end
      resolvedCurrentPeriodEnd = addOneMonth(existing.current_period_end)
    } else {
      resolvedCurrentPeriodStart = now
      resolvedCurrentPeriodEnd = addOneMonth(now)
    }
  }

  const canceledAt = status === "active" ? null : now

  const subscription = existing
    ? await updateSubscriptionForUpsert({
        id: existing.id,
        status,
        provider,
        providerSubscriptionId:
          providerSubscriptionId ?? existing.provider_subscription_id,
        currentPeriodStart: resolvedCurrentPeriodStart,
        currentPeriodEnd: resolvedCurrentPeriodEnd,
        canceledAt,
        cancelAtPeriodEnd: status === "active" ? cancelAtPeriodEnd : false,
        updatedAt: now,
      })
    : await insertSubscriptionForUpsert({
        userId,
        creatorId,
        status,
        provider,
        providerSubscriptionId: providerSubscriptionId ?? null,
        currentPeriodStart: resolvedCurrentPeriodStart,
        currentPeriodEnd: resolvedCurrentPeriodEnd,
        canceledAt,
        cancelAtPeriodEnd: status === "active" ? cancelAtPeriodEnd : false,
      })

  if (subscription.status === "active") {
    await issueCreatorMembershipGrantNoThrow({
      viewerUserId: subscription.user_id,
      creatorId: subscription.creator_id,
      subscriptionId: subscription.id,
      startsAt: subscription.current_period_start ?? now,
      expiresAt: subscription.current_period_end,
      sourceType: "subscription_upsert",
      metadata: {
        provider: subscription.provider,
        providerSubscriptionId: subscription.provider_subscription_id,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        phase: "phase6_step3_shadow_grant_write",
      },
    })
  }

  return subscription
}
