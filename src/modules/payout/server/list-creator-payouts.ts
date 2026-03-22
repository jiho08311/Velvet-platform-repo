import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type ListCreatorPayoutsParams = {
  creatorId: string
}

export async function listCreatorPayouts({
  creatorId,
}: ListCreatorPayoutsParams) {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("payouts")
    .select(
      "id, amount_cents, currency, status, created_at, paid_at, failure_reason"
    )
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}