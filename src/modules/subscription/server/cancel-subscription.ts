import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type CancelSubscriptionInput = {
  userId: string
  creatorId: string
}

export async function cancelSubscription({
  userId,
  creatorId,
}: CancelSubscriptionInput) {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("creator_id", creatorId)
    .eq("status", "active")
    .select("id, user_id, creator_id, current_period_end")
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}