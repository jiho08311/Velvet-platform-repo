import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type GetPayoutRequestParams = {
  payoutRequestId: string
}

type PayoutRequestRow = {
  id: string
  creator_id: string
  amount: number
  currency: string
  status: string
  created_at: string
  approved_at: string | null
}

export type PayoutRequest = {
  id: string
  creatorId: string
  amount: number
  currency: string
  status: string
  createdAt: string
  approvedAt: string | null
}

export async function getPayoutRequest({
  payoutRequestId,
}: GetPayoutRequestParams): Promise<PayoutRequest | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("payout_requests")
    .select(
      "id, creator_id, amount, currency, status, created_at, approved_at"
    )
    .eq("id", payoutRequestId)
    .maybeSingle<PayoutRequestRow>()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return {
    id: data.id,
    creatorId: data.creator_id,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    createdAt: data.created_at,
    approvedAt: data.approved_at,
  }
}