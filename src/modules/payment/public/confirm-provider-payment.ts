import {
  confirmProviderPayment as confirmProviderPaymentRuntime,
} from "@/modules/payment/runtime/confirm-provider-payment"

export const PUBLIC_CONTRACT = true

export type ConfirmProviderPaymentInput = Parameters<
  typeof confirmProviderPaymentRuntime
>[0]

export type ConfirmProviderPaymentResult = Awaited<
  ReturnType<typeof confirmProviderPaymentRuntime>
>

export async function confirmProviderPayment(
  input: ConfirmProviderPaymentInput
): Promise<ConfirmProviderPaymentResult> {
  return confirmProviderPaymentRuntime(input)
}
