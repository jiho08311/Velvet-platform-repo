import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { getCreatorBalance } from "./get-creator-balance"

type PayoutRow = {
  id: string
  amount: number | null
  status: "pending" | "processing" | "paid" | "failed"
  created_at: string
}

type PendingPayoutRequestRow = {
  amount: number | null
}

export type PayoutSummary = {
  creatorId: string
  currency: string
  availableBalance: number
  pendingAmount: number
  recentPayouts: Array<{
    id: string
    amount: number
    status: "pending" | "processing" | "paid" | "failed"
    createdAt: string
  }>
}

export async function getPayoutSummary(
  creatorId: string
): Promise<PayoutSummary | null> {
  const supabase = await createSupabaseServerClient()

  const id = creatorId.trim()

  if (!id) {
    return null
  }

  const balance = await getCreatorBalance({ creatorId: id })

  const { data: payouts, error: payoutsError } = await supabase
    .from("payouts")
    .select("id, amount, status, created_at")
    .eq("creator_id", id)
    .order("created_at", { ascending: false })
    .returns<PayoutRow[]>()

  if (payoutsError) {
    throw payoutsError
  }

  const { data: pendingRequests, error: pendingRequestsError } = await supabase
    .from("payout_requests")
    .select("amount")
    .eq("creator_id", id)
    .eq("status", "pending")
    .returns<PendingPayoutRequestRow[]>()

  if (pendingRequestsError) {
    throw pendingRequestsError
  }

  const pendingAmount =
    pendingRequests?.reduce((sum, row) => sum + (row.amount ?? 0), 0) ?? 0

  return {
    creatorId: id,
    currency: "KRW",
    availableBalance: balance.availableBalance,
    pendingAmount,
    recentPayouts:
      payouts?.slice(0, 5).map((payout) => ({
        id: payout.id,
        amount: payout.amount ?? 0,
        status: payout.status,
        createdAt: payout.created_at,
      })) ?? [],
  }
}