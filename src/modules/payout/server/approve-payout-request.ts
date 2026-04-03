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

export async function approvePayoutRequest({
  payoutRequestId,
}: ApprovePayoutRequestParams): Promise<void> {
  const safePayoutRequestId = payoutRequestId.trim()

  if (!safePayoutRequestId) {
    throw new Error("Invalid payout request id")
  }

  // 🔥 1. 어떤 id 눌렸는지
  console.log("[APPROVE] payoutRequestId:", safePayoutRequestId)

  const { data, error } = await supabaseAdmin.rpc(
    "approve_payout_request_and_create_payout",
    {
      p_payout_request_id: safePayoutRequestId,
    }
  )

  // 🔥 2. RPC 결과 raw
  console.log("[APPROVE] rpc result:", data)

  if (error) {
    console.error("[APPROVE] rpc error:", error)
    throw error
  }

  const rows = (data ?? []) as ApprovePayoutRequestResultRow[]

  // 🔥 3. rows length 확인
  console.log("[APPROVE] rows length:", rows.length)

  if (rows.length === 0) {
    throw new Error("Failed to approve payout request")
  }
}