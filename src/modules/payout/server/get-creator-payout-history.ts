import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { requireUser } from "@/modules/auth/server/require-user"

export async function getCreatorPayoutHistory() {
  const user = await requireUser()

  const { data: creator, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (creatorError || !creator) {
    throw new Error("Creator not found")
  }

  const { data: payouts, error: payoutsError } = await supabaseAdmin
    .from("payouts")
    .select(
      "id, amount_cents, currency, status, paid_at, failure_reason, created_at"
    )
    .eq("creator_id", creator.id)
    .order("created_at", { ascending: false })
    .limit(20)

  if (payoutsError) {
    throw payoutsError
  }

  return payouts ?? []
}