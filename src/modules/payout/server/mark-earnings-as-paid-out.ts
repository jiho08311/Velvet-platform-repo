import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type MarkEarningsAsPaidOutInput = {
  payoutId: string
}

type PaidOutEarningRow = {
  id: string
  payout_id: string | null
  status: "pending" | "available" | "paid_out" | "reversed"
  paid_out_at: string | null
}

export async function markEarningsAsPaidOut({
  payoutId,
}: MarkEarningsAsPaidOutInput): Promise<PaidOutEarningRow[]> {
  const safePayoutId = payoutId.trim()

  if (!safePayoutId) {
    throw new Error("Invalid payout id")
  }

  const paidOutAt = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from("earnings")
    .update({
      status: "paid_out",
      paid_out_at: paidOutAt,
    })
    .eq("payout_id", safePayoutId)
    .eq("status", "available")
    .select("id, payout_id, status, paid_out_at")
    .returns<PaidOutEarningRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}