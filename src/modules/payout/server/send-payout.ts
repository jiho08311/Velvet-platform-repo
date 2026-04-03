import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { markEarningsAsPaidOut } from "./mark-earnings-as-paid-out"

type SendPayoutParams = {
  payoutId: string
}

export async function sendPayout({ payoutId }: SendPayoutParams) {
  const safePayoutId = payoutId.trim()

  if (!safePayoutId) {
    throw new Error("Invalid payout id")
  }

  const { data: payout, error: payoutError } = await supabaseAdmin
    .from("payouts")
    .select("id, creator_id, amount, currency, status")
    .eq("id", safePayoutId)
    .single()

  if (payoutError || !payout) {
    throw new Error("Payout not found")
  }

  if (payout.status === "paid") {
    return payout
  }

  if (payout.status !== "failed") {
    throw new Error("Payout is not sendable")
  }

  try {
    const { data: updatedPayout, error: updateError } =
      await supabaseAdmin
        .from("payouts")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          failure_reason: null,
        })
        .eq("id", payout.id)
        .eq("status", "failed")
        .select("id, status, paid_at, failure_reason")
        .single()

    if (updateError) {
      throw updateError
    }

    await markEarningsAsPaidOut({
      payoutId: payout.id,
    })

    return updatedPayout
  } catch (error) {
    const failureReason =
      error instanceof Error ? error.message : "Unknown payout error"

    await supabaseAdmin
      .from("payouts")
      .update({
        status: "failed",
        failure_reason: failureReason,
      })
      .eq("id", payout.id)

    throw error
  }
}