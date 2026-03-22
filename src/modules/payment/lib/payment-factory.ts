import type {
  ConfirmPaymentResult,
  CreatePaymentResult,
  PaymentProvider,
} from "./payment-provider"

class MockPaymentProvider implements PaymentProvider {
  async createPayment(): Promise<CreatePaymentResult> {
    return {
      checkoutUrl: "/payment/success",
      providerPaymentId: "mock_payment_id",
    }
  }

  async confirmPayment(): Promise<ConfirmPaymentResult> {
    return {
      status: "succeeded",
      providerPaymentId: "mock_payment_id",
    }
  }
}

export function getPaymentProvider(): PaymentProvider {
  // TODO: 환경 변수 기준으로 PG 선택 (toss / iamport 등)
  return new MockPaymentProvider()
}