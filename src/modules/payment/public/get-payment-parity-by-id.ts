import {
  findPaymentForParityById,
} from "@/modules/payment/repositories/payment-read-repository"

export const PUBLIC_CONTRACT = true

export type PaymentParityReadContract = {
  id: string
  user_id: string
  creator_id: string | null
  type: string
  status: string
  amount: number
  currency: string
  provider: string | null
  target_type: "post" | "message" | null
  target_id: string | null
  confirmed_at: string | null
  created_at: string
  updated_at: string | null
}

export async function getPaymentParityById(
  paymentId: string,
): Promise<PaymentParityReadContract | null> {
  return findPaymentForParityById(paymentId)
}
