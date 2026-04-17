import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createNotification } from "@/modules/notification/server/create-notification"

type NotifySubscriptionCanceledWorkflowInput = {
  subscriptionId: string
  creatorId: string
  subscriberId: string
  mode: "period_end" | "immediate"
}

type CreatorRow = {
  user_id: string
}

export async function notifySubscriptionCanceledWorkflow({
  subscriptionId,
  creatorId,
  subscriberId,
  mode,
}: NotifySubscriptionCanceledWorkflowInput): Promise<void> {
  const { data: creator, error } = await supabaseAdmin
    .from("creators")
    .select("user_id")
    .eq("id", creatorId)
    .maybeSingle<CreatorRow>()

  if (error) {
    throw error
  }

  if (!creator?.user_id) {
    return
  }

  await createNotification({
    userId: creator.user_id,
    type: "subscription_canceled",
    title:
      mode === "period_end"
        ? "Subscription cancellation scheduled"
        : "Subscription canceled",
    body:
      mode === "period_end"
        ? "A subscriber scheduled cancellation at period end."
        : "A subscriber canceled their subscription immediately.",
    data: {
      creatorId,
      subscriberId,
      subscriptionId,
    },
  })
}