import createPaymentRuntime from "@/modules/payment/runtime/create-payment"

export const PUBLIC_CONTRACT = true

export type CreatePaymentInput = Parameters<typeof createPaymentRuntime>[0]
export type CreatePaymentResult = Awaited<ReturnType<typeof createPaymentRuntime>>

export default async function createPayment(
  input: CreatePaymentInput
): Promise<CreatePaymentResult> {
  return createPaymentRuntime(input)
}
