import {
  createPpvPostPayment as createPpvPostPaymentRuntime,
} from "@/modules/payment/runtime/create-ppv-post-payment"

export const PUBLIC_CONTRACT = true

export type CreatePpvPostPaymentInput = Parameters<
  typeof createPpvPostPaymentRuntime
>[0]

export type CreatePpvPostPaymentResult = Awaited<
  ReturnType<typeof createPpvPostPaymentRuntime>
>

export async function createPpvPostPayment(
  input: CreatePpvPostPaymentInput
): Promise<CreatePpvPostPaymentResult> {
  return createPpvPostPaymentRuntime(input)
}
