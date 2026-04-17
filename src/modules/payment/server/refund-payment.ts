import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { reverseEarning } from "@/modules/payout/server/reverse-earning"

type RefundPaymentInput = {
  paymentId: string
}

type PaymentRow = {
  id: string
  status: "pending" | "succeeded" | "failed" | "refunded"
  user_id: string
  creator_id: string | null
  type: "subscription" | "tip" | "ppv_message" | "ppv_post"
}

export async function refundPayment({
  paymentId,
}: RefundPaymentInput): Promise<void> {
  const safePaymentId = paymentId.trim()

  if (!safePaymentId) {
    throw new Error("Invalid payment id")
  }

  const { data: payment, error: paymentError } = await supabaseAdmin
    .from("payments")
    .select("id, status, user_id, creator_id, type")
    .eq("id", safePaymentId)
    .maybeSingle<PaymentRow>()

  if (paymentError) {
    throw paymentError
  }

  if (!payment) {
    throw new Error("PAYMENT_NOT_FOUND")
  }

  if (payment.status === "refunded") {
    return
  }

  if (payment.status !== "succeeded") {
    throw new Error("PAYMENT_NOT_REFUNDABLE")
  }

  const now = new Date().toISOString()

  const { error: updateError } = await supabaseAdmin
    .from("payments")
    .update({
      status: "refunded",
      updated_at: now,
    })
    .eq("id", payment.id)
    .eq("status", "succeeded")

  if (updateError) {
    throw updateError
  }

  await reverseEarning({
    paymentId: payment.id,
  })

  if (payment.type === "subscription" && payment.creator_id) {
    await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "expired",
        cancel_at_period_end: false,
        canceled_at: now,
        updated_at: now,
      })
      .eq("user_id", payment.user_id)
      .eq("creator_id", payment.creator_id)
      .eq("status", "active")
  }
}