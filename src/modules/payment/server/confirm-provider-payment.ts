import { confirmPayment } from "./confirm-payment"
import { getPaymentProvider } from "./payment-provider-factory"
import type { PaymentProviderName } from "./payment-provider"

type ConfirmProviderPaymentInput = {
  paymentId: string
  provider: PaymentProviderName
  providerReferenceId?: string
}

export async function confirmProviderPayment({
  paymentId,
  provider,
  providerReferenceId,
}: ConfirmProviderPaymentInput) {
  const paymentProvider = getPaymentProvider(provider)

  const providerResult = await paymentProvider.confirmPayment({
    paymentId,
    providerReferenceId,
  })

  if (providerResult.status !== "succeeded") {
    return {
      status: "failed" as const,
      payment: null,
      providerResult,
    }
  }

  const payment = await confirmPayment({ paymentId })

  return {
    status: payment ? "succeeded" as const : "failed" as const,
    payment,
    providerResult,
  }
}