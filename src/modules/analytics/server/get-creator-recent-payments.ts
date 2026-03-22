import { createClient } from "@/infrastructure/supabase/server"

export async function getCreatorRecentPayments(creatorId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from("payments")
    .select(`
      id,
      amount_cents,
      currency,
      created_at,
      user_id
    `)
    .eq("creator_id", creatorId)
    .eq("status", "succeeded")
    .order("created_at", { ascending: false })
    .limit(10)

  return data ?? []
}