import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type ApprovePayoutRequestParams = {
  payoutRequestId: string
}

type ApprovedPayoutRequestRow = {
  id: string
  creator_id: string
  amount_cents: number
  currency: string
  status: string
  approved_at: string | null
}

export async function approvePayoutRequest({
  payoutRequestId,
}: ApprovePayoutRequestParams): Promise<void> {
  const safePayoutRequestId = payoutRequestId.trim()

  if (!safePayoutRequestId) {
    throw new Error("Invalid payout request id")
  }

  const now = new Date().toISOString()

  const { data: approvedRequest, error: updateError } = await supabaseAdmin
    .from("payout_requests")
    .update({
      status: "approved",
      approved_at: now,
    })
    .eq("id", safePayoutRequestId)
    .eq("status", "pending")
    .select("id, creator_id, amount_cents, currency, status, approved_at")
    .maybeSingle<ApprovedPayoutRequestRow>()

  if (updateError) {
    throw updateError
  }

  if (!approvedRequest) {
    throw new Error("Payout request not found or not pending")
  }

  const { error: insertError } = await supabaseAdmin
    .from("payouts")
    .insert({
      creator_id: approvedRequest.creator_id,
      amount_cents: approvedRequest.amount_cents,
      currency: approvedRequest.currency,
      status: "completed",
      provider_payout_id: null,
      created_at: now,
    })

  if (insertError) {
    throw insertError
  }
}