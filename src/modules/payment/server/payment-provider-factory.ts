import { PaymentProvider, PaymentProviderName } from "./payment-provider"
import { mockPaymentProvider } from "./mock-payment-provider"
import { tossPaymentProvider } from "./toss-payment-provider"

export function getPaymentProvider(
  provider: PaymentProviderName
): PaymentProvider {
  switch (provider) {
    case "mock":
      return mockPaymentProvider

    case "toss":
      return tossPaymentProvider

    default:
      throw new Error(`Unsupported payment provider: ${provider}`)
  }
}