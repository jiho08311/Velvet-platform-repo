import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type RejectPayoutRequestParams = {
  payoutRequestId: string
}

type RejectedPayoutRequestRow = {
  id: string
  status: string
  rejected_at: string | null
}

export async function rejectPayoutRequest({
  payoutRequestId,
}: RejectPayoutRequestParams): Promise<void> {
  const safePayoutRequestId = payoutRequestId.trim()

  if (!safePayoutRequestId) {
    throw new Error("Invalid payout request id")
  }

  const rejectedAt = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from("payout_requests")
    .update({
      status: "rejected",
      rejected_at: rejectedAt,
    })
    .eq("id", safePayoutRequestId)
    .eq("status", "pending")
    .select("id, status, rejected_at")
    .maybeSingle<RejectedPayoutRequestRow>()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error("Payout request not found or not pending")
  }

  const { error: releaseError } = await supabaseAdmin
    .from("earnings")
    .update({
      status: "available",
      payout_request_id: null,
    })
    .eq("payout_request_id", safePayoutRequestId)
    .eq("status", "requested")

  if (releaseError) {
    throw releaseError
  }
}