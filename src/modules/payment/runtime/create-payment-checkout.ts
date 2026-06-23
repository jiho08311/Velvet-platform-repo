import {
  createPaymentCheckoutService,
  type CreatePaymentCheckoutInput,
} from "@/modules/payment/services/payment-checkout-service"

export async function createPaymentCheckout(input: CreatePaymentCheckoutInput) {
  return createPaymentCheckoutService(input)
}
