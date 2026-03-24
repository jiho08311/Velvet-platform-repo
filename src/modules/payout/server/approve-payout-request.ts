import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type ApprovePayoutRequestParams = {
  payoutRequestId: string
}

type ApprovePayoutRequestResultRow = {
  payout_request_id: string
  payout_id: string
  creator_id: string
  amount_cents: number
  currency: string
  status: string
}

export async function approvePayoutRequest({
  payoutRequestId,
}: ApprovePayoutRequestParams): Promise<void> {
  const safePayoutRequestId = payoutRequestId.trim()

  if (!safePayoutRequestId) {
    throw new Error("Invalid payout request id")
  }

  const { data, error } = await supabaseAdmin.rpc(
    "approve_payout_request_and_create_payout",
    {
      p_payout_request_id: safePayoutRequestId,
    }
  )

  if (error) {
    throw error
  }

  const rows = (data ?? []) as ApprovePayoutRequestResultRow[]

  if (rows.length === 0) {
    throw new Error("Failed to approve payout request")
  }
}