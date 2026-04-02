import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type CancelSubscriptionInput = {
  userId: string
  creatorId: string
}

export async function cancelSubscription({
  userId,
  creatorId,
}: CancelSubscriptionInput) {
  const now = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      cancel_at_period_end: true,
      canceled_at: now,
      updated_at: now,
    })
    .eq("user_id", userId)
    .eq("creator_id", creatorId)
    .eq("status", "active")
    .eq("cancel_at_period_end", false)
    .select("id, user_id, creator_id, current_period_end, canceled_at, cancel_at_period_end")
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}