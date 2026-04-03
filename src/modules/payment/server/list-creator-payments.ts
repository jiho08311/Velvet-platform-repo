import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type ListCreatorPaymentsParams = {
  creatorId: string
}

export async function listCreatorPayments({
  creatorId,
}: ListCreatorPaymentsParams) {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("payments")
    .select("id, amount, currency, user_id, created_at")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}