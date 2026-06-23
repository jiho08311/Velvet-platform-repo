import {
  getPaymentConfirmationTarget as getPaymentConfirmationTargetRuntime,
} from "@/modules/payment/runtime/get-payment-confirmation-target"

export const PUBLIC_CONTRACT = true

export type GetPaymentConfirmationTargetInput = Parameters<
  typeof getPaymentConfirmationTargetRuntime
>[0]

export type PaymentConfirmationTarget = NonNullable<
  Awaited<ReturnType<typeof getPaymentConfirmationTargetRuntime>>
>

export async function getPaymentConfirmationTarget(
  paymentId: GetPaymentConfirmationTargetInput
): Promise<PaymentConfirmationTarget | null> {
  return getPaymentConfirmationTargetRuntime(paymentId)
}
