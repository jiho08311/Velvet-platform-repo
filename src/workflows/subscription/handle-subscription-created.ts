import { upsertSubscription } from "@/modules/subscription/server/upsert-subscription"
import { createNotification } from "@/modules/notification/server/create-notification"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export async function handleSubscriptionCreated({
  userId,
  creatorId,
}: {
  userId: string
  creatorId: string
}) {
  // 1. 기존 active 여부 확인
  const { data: existing } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("creator_id", creatorId)
    .eq("status", "active")
    .maybeSingle()

  const isNew = !existing

  // 2. subscription upsert
  const subscription = await upsertSubscription({
    userId,
    creatorId,
    status: "active",
  })

  // 3. 신규 구독일 때만 notification
  if (isNew) {
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