import { getPaymentParityById } from "@/modules/payment/public/get-payment-parity-by-id"
import { confirmPayment } from "@/modules/payment/public/confirm-payment"
import { createPaymentCheckout } from "@/modules/payment/public/create-payment-checkout"
import { handlePaymentFailure } from "@/modules/payment/public/handle-payment-failure"
import { refundPayment } from "@/modules/payment/public/refund-payment"

export async function refundCanonicalPayment(input: {
  paymentId: string
}) {
  return refundPayment(input)
}

export async function getCanonicalPaymentById(paymentId: string) {
  return getPaymentParityById(paymentId)
}

export async function confirmCanonicalPayment(input: {
  paymentId: string
  paymentKey?: string
  orderId?: string
  amount?: number
}) {
  return confirmPayment(input)
}

export async function createCanonicalPaymentCheckout(
  input: Parameters<typeof createPaymentCheckout>[0]
) {
  return createPaymentCheckout(input)
}

export async function failCanonicalPayment(input: {
  paymentId: string
  failureReason: string
}) {
  return handlePaymentFailure(input)
}
