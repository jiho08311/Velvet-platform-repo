import {
  PaymentProvider,
  CreateProviderCheckoutInput,
  CreateProviderCheckoutResult,
  ConfirmProviderPaymentInput,
  ConfirmProviderPaymentResult,
} from "./payment-provider"

export const tossPaymentProvider: PaymentProvider = {
  name: "toss",

  async createCheckout(
    input: CreateProviderCheckoutInput
  ): Promise<CreateProviderCheckoutResult> {
    const clientKey = process.env.TOSS_CLIENT_KEY

    if (!clientKey) {
      throw new Error("Missing TOSS_CLIENT_KEY")
    }

    const url = `https://js.tosspayments.com/v1/payment?clientKey=${clientKey}&orderId=${input.orderId}&orderName=${encodeURIComponent(
      input.orderName
    )}&amount=${input.amountCents} &successUrl=${encodeURIComponent(
      input.successUrl
    )}&failUrl=${encodeURIComponent(input.failUrl)}`

    return {
      provider: "toss",
      checkoutUrl: url,
      providerReferenceId: input.paymentId,
    }
  },

  async confirmPayment(
    input: ConfirmProviderPaymentInput
  ): Promise<ConfirmProviderPaymentResult> {
    return {
      provider: "toss",
      status: "succeeded",
      providerReferenceId: input.paymentId,
    }
  },
}