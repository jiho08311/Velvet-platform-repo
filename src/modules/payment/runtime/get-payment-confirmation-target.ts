import {
  findPaymentConfirmationTargetById,
  type PaymentConfirmationTargetRow,
} from "@/modules/payment/repositories/payment-read-repository"

export type PaymentConfirmationTarget = PaymentConfirmationTargetRow

export async function getPaymentConfirmationTarget(
  paymentId: string
): Promise<PaymentConfirmationTarget | null> {
  return findPaymentConfirmationTargetById(paymentId)
}
