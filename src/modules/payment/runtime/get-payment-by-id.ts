import { findPaymentById } from "@/modules/payment/repositories/payment-read-repository"

export type PaymentDetails = {
  id: string
  viewerUserId: string
  creatorId: string | null
  amount: number
  status: "pending" | "succeeded" | "failed" | "refunded"
  createdAt: string
}

export async function getPaymentById(
  paymentId: string
): Promise<PaymentDetails | null> {
  const id = paymentId.trim()
  if (!id) return null

  const data = await findPaymentById(id)
  if (!data) return null

  return {
    id: data.id,
    viewerUserId: data.user_id,
    creatorId: data.creator_id,
    amount: data.amount,
    status: data.status,
    createdAt: data.created_at,
  }
}
