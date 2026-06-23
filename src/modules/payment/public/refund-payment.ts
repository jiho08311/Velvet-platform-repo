import {
  refundPayment as refundPaymentRuntime,
} from "@/modules/payment/runtime/refund-payment"

export const PUBLIC_CONTRACT = true

export type RefundPaymentInput = Parameters<typeof refundPaymentRuntime>[0]

export async function refundPayment(input: RefundPaymentInput): Promise<void> {
  return refundPaymentRuntime(input)
}
