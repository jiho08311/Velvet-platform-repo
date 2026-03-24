import { createClient } from "@/infrastructure/supabase/server"

export async function unsubscribe(subscriptionId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      cancel_at_period_end: false,
    })
    .eq("id", subscriptionId)
    .select("id, status, canceled_at, cancel_at_period_end")
    .maybeSingle()

  if (error) {
    throw new Error("Failed to unsubscribe")
  }

  return data
}