import {
  getPaymentById as getPaymentByIdRuntime,
  type PaymentDetails,
} from "@/modules/payment/runtime/get-payment-by-id"

export const PUBLIC_CONTRACT = true

export type { PaymentDetails }

export async function getPaymentById(
  paymentId: string
): Promise<PaymentDetails | null> {
  return getPaymentByIdRuntime(paymentId)
}
