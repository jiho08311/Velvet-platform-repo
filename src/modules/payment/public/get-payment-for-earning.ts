import {
  getPaymentForEarning as getPaymentForEarningRuntime,
} from "@/modules/payment/runtime/get-payment-for-earning"

export const PUBLIC_CONTRACT = true

export type GetPaymentForEarningInput = Parameters<
  typeof getPaymentForEarningRuntime
>[0]

export type PaymentForEarning = NonNullable<
  Awaited<ReturnType<typeof getPaymentForEarningRuntime>>
>

export async function getPaymentForEarning(
  paymentId: GetPaymentForEarningInput
): Promise<PaymentForEarning | null> {
  return getPaymentForEarningRuntime(paymentId)
}
