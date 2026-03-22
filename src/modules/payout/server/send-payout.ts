import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type SendPayoutParams = {
  payoutId: string
}

export async function sendPayout({ payoutId }: SendPayoutParams) {
  const { data: payout, error: payoutError } = await supabaseAdmin
    .from("payouts")
    .select("id, creator_id, amount_cents, currency, status")
    .eq("id", payoutId)
    .single()

  if (payoutError || !payout) {
    throw new Error("Payout not found")
  }

  if (payout.status === "paid") {
    console.log("PAYOUT SKIP: already processed", {
      payoutId: payout.id,
      status: payout.status,
    })

    return {
      id: payout.id,
      status: payout.status,
    }
  }

  if (payout.status !== "pending" && payout.status !== "failed") {
    throw new Error("Payout is not sendable")
  }

  const { data: creator, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select("id")
    .eq("id", payout.creator_id)
    .single()

  if (creatorError || !creator) {
    throw new Error("Creator not found")
  }

  try {
    const { data: updatedPayout, error: updateError } = await supabaseAdmin
      .from("payouts")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        failure_reason: null,
      })
      .eq("id", payout.id)
      .select("id, status, paid_at, failure_reason")
      .single()

    if (updateError) {
      throw updateError
    }

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