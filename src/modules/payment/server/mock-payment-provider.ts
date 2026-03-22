import {
  PaymentProvider,
  CreateProviderCheckoutInput,
  CreateProviderCheckoutResult,
  ConfirmProviderPaymentInput,
  ConfirmProviderPaymentResult,
} from "./payment-provider"

export const mockPaymentProvider: PaymentProvider = {
  name: "mock",

  async createCheckout(
    input: CreateProviderCheckoutInput
  ): Promise<CreateProviderCheckoutResult> {
    return {
      provider: "mock",
      checkoutUrl: null, // mock은 redirect 없음
      providerReferenceId: input.paymentId,
    }
  },

  async confirmPayment(
    input: ConfirmProviderPaymentInput
  ): Promise<ConfirmProviderPaymentResult> {
    return {
      provider: "mock",
      status: "succeeded",
      providerReferenceId: input.paymentId,
    }
  },
}