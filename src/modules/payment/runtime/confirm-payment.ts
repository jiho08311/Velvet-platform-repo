import {
  confirmPaymentService,
  type ConfirmedPayment,
} from "@/modules/payment/services/payment-confirmation-service"

type ConfirmPaymentInput = {
  paymentId: string
  paymentKey?: string
  orderId?: string
  amount?: number
}

export type { ConfirmedPayment }

export async function confirmPayment(
  input: ConfirmPaymentInput
): Promise<ConfirmedPayment | null> {
  return confirmPaymentService(input)
}
