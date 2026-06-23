// src/modules/payment/public/confirm-payment.ts
import {
  confirmPayment as confirmPaymentRuntime,
  type ConfirmedPayment,
} from "@/modules/payment/runtime/confirm-payment"

export const PUBLIC_CONTRACT = true

export type ConfirmPaymentInput = {
  paymentId: string
  paymentKey?: string
  orderId?: string
  amount?: number
}

export type ConfirmPaymentResult = ConfirmedPayment | null

export async function confirmPayment(
  input: ConfirmPaymentInput
): Promise<ConfirmPaymentResult> {
  return confirmPaymentRuntime(input)
}
