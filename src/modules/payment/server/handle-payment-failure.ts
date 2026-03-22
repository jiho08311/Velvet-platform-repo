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

  // Minimal failure logging (placeholder for real logging or persistence)
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