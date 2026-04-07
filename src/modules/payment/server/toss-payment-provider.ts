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
    return {
      provider: "toss",
      checkoutUrl: null,
      providerReferenceId: input.paymentId,
    }
  },

  async confirmPayment(
    input: ConfirmProviderPaymentInput
  ): Promise<ConfirmProviderPaymentResult> {
    const secretKey = process.env.TOSS_SECRET_KEY

    if (!secretKey) {
      throw new Error("Missing TOSS_SECRET_KEY")
    }

    const paymentKey = input.providerReferenceId
    const orderId = input.orderId
    const amount = input.amount

    if (!paymentKey || !orderId || amount == null) {
      throw new Error("Missing toss confirm params")
    }

    const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(secretKey + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error("Toss confirm error:", text)
      throw new Error("TOSS_CONFIRM_FAILED")
    }

    return {
      provider: "toss",
      status: "succeeded",
      providerReferenceId: paymentKey,
    }
  },
}