import { supabaseAdmin } from "@/infrastructure/supabase/admin"

import { reverseEarning } from "@/modules/payout/server/reverse-earning"

type RefundPaymentInput = {
  paymentId: string
}

type PaymentRow = {
  id: string
  status: "pending" | "succeeded" | "failed" | "refunded"
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
    .select("id, status")
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

  const { error: updateError } = await supabaseAdmin
    .from("payments")
    .update({
      status: "refunded",
    })
    .eq("id", payment.id)
    .eq("status", "succeeded")

  if (updateError) {
    throw updateError
  }

  await reverseEarning({
    paymentId: payment.id,
  })
}