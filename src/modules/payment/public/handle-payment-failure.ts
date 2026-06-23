import {
  handlePaymentFailure as handlePaymentFailureRuntime,
} from "@/modules/payment/runtime/handle-payment-failure"

export const PUBLIC_CONTRACT = true

export type HandlePaymentFailureInput = Parameters<
  typeof handlePaymentFailureRuntime
>[0]

export type FailedPayment = NonNullable<
  Awaited<ReturnType<typeof handlePaymentFailureRuntime>>
>

export async function handlePaymentFailure(
  input: HandlePaymentFailureInput
): Promise<FailedPayment | null> {
  return handlePaymentFailureRuntime(input)
}
