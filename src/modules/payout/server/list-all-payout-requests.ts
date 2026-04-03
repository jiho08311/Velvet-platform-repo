import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type PayoutRequestRow = {
  id: string
  creator_id: string
  amount: number
  currency: string
  status: string
  created_at: string
  approved_at: string | null
  rejected_at: string | null
}

export type PayoutRequest = {
  id: string
  creatorId: string
  amount: number
  currency: string
  status: string
  createdAt: string
  approvedAt: string | null
  rejectedAt: string | null
}

export async function listAllPayoutRequests(): Promise<PayoutRequest[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("payout_requests")
    .select(
      "id, creator_id, amount, currency, status, created_at, approved_at, rejected_at"
    )
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row: PayoutRequestRow) => ({
    id: row.id,
    creatorId: row.creator_id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    createdAt: row.created_at,
    approvedAt: row.approved_at,
    rejectedAt: row.rejected_at,
  }))
}