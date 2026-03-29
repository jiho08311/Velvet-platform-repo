import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type HandlePaymentFailureInput = {
  paymentId: string
  failureReason: string
}

export type FailedPayment = {
  id: string
  status: "failed"
  failureReason: string
  failedAt: string
}

type PaymentRow = {
  id: string
  status: "pending" | "succeeded" | "failed" | "refunded"
}

export async function handlePaymentFailure(
  input: HandlePaymentFailureInput
): Promise<FailedPayment | null> {
  const paymentId = input.paymentId.trim()
  const failureReason = input.failureReason.trim()

  if (!paymentId) {
    return null
  }

  if (!failureReason) {
    throw new Error("Failure reason is required")
  }

  const failedAt = new Date().toISOString()

  const { data: payment, error: paymentError } = await supabaseAdmin
    .from("payments")
    .select("id, status")
    .eq("id", paymentId)
    .maybeSingle<PaymentRow>()

  if (paymentError) {
    throw paymentError
  }

  if (payment) {
    if (payment.status !== "failed" && payment.status !== "refunded") {
      const { error: updateError } = await supabaseAdmin
        .from("payments")
        .update({
          status: "failed",
          updated_at: failedAt,
        })
        .eq("id", payment.id)

      if (updateError) {
        throw updateError
      }
    }
  }

  console.error("Payment failed", {
    paymentId,
    failureReason,
    failedAt,
  })

  return {
    id: paymentId,
    status: "failed",
    failureReason,
    failedAt,
  }
}