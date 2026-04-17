import { createClient } from "@/infrastructure/supabase/server"

export async function unsubscribe(subscriptionId: string) {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      cancel_at_period_end: true,
      canceled_at: now,
      updated_at: now,
    })
    .eq("id", subscriptionId)
    .select(
      "id, user_id, creator_id, status, current_period_end, canceled_at, cancel_at_period_end"
    )
    .maybeSingle()

  if (error) {
    throw new Error("Failed to unsubscribe")
  }

  return data
}