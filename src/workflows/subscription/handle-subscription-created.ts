import { upsertSubscription } from "@/modules/subscription/server/upsert-subscription"
import { createNotification } from "@/modules/notification/server/create-notification"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { resolveSubscriptionState } from "@/modules/subscription/lib/resolve-subscription-state"

type ExistingSubscriptionRow = {
  id: string
  status: "incomplete" | "active" | "canceled" | "expired"
  current_period_end: string | null
  cancel_at_period_end: boolean | null
  canceled_at: string | null
  created_at: string
}

export async function handleSubscriptionCreated({
  userId,
  creatorId,
}: {
  userId: string
  creatorId: string
}) {
  const { data: existingRows, error: existingError } = await supabaseAdmin
    .from("subscriptions")
    .select(
      "id, status, current_period_end, cancel_at_period_end, canceled_at, created_at"
    )
    .eq("user_id", userId)
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })
    .returns<ExistingSubscriptionRow[]>()

  if (existingError) {
    throw existingError
  }

  const hasExistingAccessSubscription = (existingRows ?? []).some((row) => {
    const resolved = resolveSubscriptionState({
      status: row.status,
      currentPeriodEndAt: row.current_period_end,
      cancelAtPeriodEnd: row.cancel_at_period_end,
      canceledAt: row.canceled_at,
    })

    return resolved.hasAccess
  })

  const subscription = await upsertSubscription({
    userId,
    creatorId,
    status: "active",
  })

  if (!hasExistingAccessSubscription) {
    const { data: creator } = await supabaseAdmin
      .from("creators")
      .select("user_id")
      .eq("id", creatorId)
      .maybeSingle()

    if (creator?.user_id) {
      await createNotification({
        userId: creator.user_id,
        type: "subscription_started",
        title: "New subscriber",
        body: "You have a new subscriber.",
        data: {
          subscriptionId: subscription.id,
        },
      })
    }
  }

  return subscription
}