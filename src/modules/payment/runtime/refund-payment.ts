import {
  refundPaymentService,
  type RefundPaymentInput,
} from "@/modules/payment/services/payment-refund-service"

export async function refundPayment({
  paymentId,
}: RefundPaymentInput): Promise<void> {
  return refundPaymentService({ paymentId })
}
