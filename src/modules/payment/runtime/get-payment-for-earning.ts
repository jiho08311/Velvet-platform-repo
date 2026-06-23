import {
  findPaymentForEarningById,
  type PaymentForEarningRow,
} from "@/modules/payment/repositories/payment-read-repository"

export type PaymentForEarning = PaymentForEarningRow

export async function getPaymentForEarning(
  paymentId: string
): Promise<PaymentForEarning | null> {
  return findPaymentForEarningById(paymentId)
}
