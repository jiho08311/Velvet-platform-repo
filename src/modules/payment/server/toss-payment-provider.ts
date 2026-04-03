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

    // 🔥 기존 구조 유지 + URL만 정상화
    const params = new URLSearchParams({
      clientKey,
      amount: String(input.amount),
      orderId: input.orderId,
      orderName: input.orderName,
      successUrl: input.successUrl,
      failUrl: input.failUrl,
    })

    const url = `https://api.tosspayments.com/v1/payments/redirect?${params.toString()}`

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