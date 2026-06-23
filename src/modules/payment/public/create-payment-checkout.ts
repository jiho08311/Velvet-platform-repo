import {
  createPaymentCheckout as createPaymentCheckoutRuntime,
} from "@/modules/payment/runtime/create-payment-checkout"
import type {
  CreatePaymentCheckoutInput,
} from "@/modules/payment/services/payment-checkout-service"

export const PUBLIC_CONTRACT = true

export type { CreatePaymentCheckoutInput }

export type CreatePaymentCheckoutResult = Awaited<
  ReturnType<typeof createPaymentCheckoutRuntime>
>

export async function createPaymentCheckout(
  input: CreatePaymentCheckoutInput
): Promise<CreatePaymentCheckoutResult> {
  return createPaymentCheckoutRuntime(input)
}
