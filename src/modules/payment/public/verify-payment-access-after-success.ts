import {
  verifyPaymentAccessAfterSuccess as verifyPaymentAccessAfterSuccessRuntime,
} from "@/modules/payment/runtime/verify-payment-access-after-success"

export const PUBLIC_CONTRACT = true

export type VerifyPaymentAccessAfterSuccessInput = Parameters<
  typeof verifyPaymentAccessAfterSuccessRuntime
>[0]

export type VerifyPaymentAccessAfterSuccessResult = Awaited<
  ReturnType<typeof verifyPaymentAccessAfterSuccessRuntime>
>

export async function verifyPaymentAccessAfterSuccess(
  input: VerifyPaymentAccessAfterSuccessInput
): Promise<VerifyPaymentAccessAfterSuccessResult> {
  return verifyPaymentAccessAfterSuccessRuntime(input)
}
