import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type PayoutAccountReadRow = {
  bank_name: string | null
  account_holder_name: string | null
  account_number: string | null
}

export async function findLatestPayoutAccountByCreatorId(
  creatorId: string
): Promise<PayoutAccountReadRow | null> {
  const { data, error } = await supabaseAdmin
    .from("payout_accounts")
    .select("bank_name, account_holder_name, account_number")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<PayoutAccountReadRow>()

  if (error) {
    throw error
  }

  return data ?? null
}