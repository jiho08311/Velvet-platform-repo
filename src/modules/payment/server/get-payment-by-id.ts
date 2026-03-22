export type PaymentDetails = {
  id: string
  viewerUserId: string
  creatorId: string
  amount: number
  status: "pending" | "succeeded" | "failed" | "refunded"
  createdAt: string
}

export async function getPaymentById(
  paymentId: string
): Promise<PaymentDetails | null> {
  if (!paymentId.trim()) {
    return null
  }

  return null
}