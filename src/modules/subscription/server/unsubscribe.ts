import { createClient } from "@/infrastructure/supabase/server"

export async function unsubscribe(subscriptionId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId)
    .select("id, status, canceled_at")
    .maybeSingle()

  if (error) {
    throw new Error("Failed to unsubscribe")
  }

  return data
}