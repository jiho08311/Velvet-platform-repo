import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type MarkEarningAsAvailableInput = {
  earningId: string
}

type AvailableEarningRow = {
  id: string
  creator_id: string
  payment_id: string
  payout_id: string | null
  source_type: "subscription" | "ppv_post" | "ppv_message"
  gross_amount: number
  fee_rate_bps: number
  fee_amount: number
  net_amount: number
  currency: string
  status: "pending" | "available" | "paid_out" | "reversed"
  available_at: string | null
  paid_out_at: string | null
  reversed_at: string | null
  created_at: string
}

export async function markEarningAsAvailable({
  earningId,
}: MarkEarningAsAvailableInput): Promise<AvailableEarningRow | null> {
  const id = earningId.trim()

  if (!id) {
    return null
  }

  const availableAt = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from("earnings")
    .update({
      status: "available",
      available_at: availableAt,
    })
    .eq("id", id)
    .eq("status", "pending")
    .select(
      "id, creator_id, payment_id, payout_id, source_type, gross_amount, fee_rate_bps, fee_amount, net_amount, currency, status, available_at, paid_out_at, reversed_at, created_at"
    )
    .maybeSingle<AvailableEarningRow>()

  if (error) {
    throw error
  }

  if (data) {
    return data
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("earnings")
    .select(
      "id, creator_id, payment_id, payout_id, source_type, gross_amount, fee_rate_bps, fee_amount, net_amount, currency, status, available_at, paid_out_at, reversed_at, created_at"
    )
    .eq("id", id)
    .maybeSingle<AvailableEarningRow>()

  if (existingError) {
    throw existingError
  }

  if (!existing) {
    return null
  }

  return existing.status === "available" ? existing : null
}