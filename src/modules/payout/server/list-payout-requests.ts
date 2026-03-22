import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type ListPayoutRequestsParams = {
  creatorId: string
}

type PayoutRequestRow = {
  id: string
  creator_id: string
  amount_cents: number
  currency: string
  status: string
  created_at: string
}

export type PayoutRequest = {
  id: string
  creatorId: string
  amountCents: number
  currency: string
  status: string
  createdAt: string
}

export async function listPayoutRequests({
  creatorId,
}: ListPayoutRequestsParams): Promise<PayoutRequest[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("payout_requests")
    .select("id, creator_id, amount_cents, currency, status, created_at")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row: PayoutRequestRow) => ({
    id: row.id,
    creatorId: row.creator_id,
    amountCents: row.amount_cents,
    currency: row.currency,
    status: row.status,
    createdAt: row.created_at,
  }))
}