import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type ApprovePayoutRequestParams = {
  payoutRequestId: string
}

type ApprovePayoutRequestResultRow = {
  payout_request_id: string
  payout_id: string
  creator_id: string
  amount: number
  currency: string
  status: string
}

type PayoutRequestRow = {
  id: string
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

  const { data: payoutRequest, error: payoutRequestError } = await supabaseAdmin
    .from("payout_requests")
    .select("id, status, approved_at")
    .eq("id", safePayoutRequestId)
    .maybeSingle<PayoutRequestRow>()

  if (payoutRequestError) {
    throw payoutRequestError
  }

  if (!payoutRequest) {
    throw new Error("APPROVED_PAYOUT_REQUEST_NOT_FOUND")
  }

  if (payoutRequest.status !== "approved") {
    throw new Error("PAYOUT_REQUEST_NOT_APPROVED")
  }

  if (!payoutRequest.approved_at) {
    throw new Error("PAYOUT_REQUEST_APPROVED_AT_MISSING")
  }
}