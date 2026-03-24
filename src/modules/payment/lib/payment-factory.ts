import type {
  ConfirmPaymentInput,
  ConfirmPaymentResult,
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
} from "./payment-provider"

class MockPaymentProvider implements PaymentProvider {
  async createPayment(
    input: CreatePaymentInput
  ): Promise<CreatePaymentResult> {
    return {
      checkoutUrl: input.successUrl,
      providerPaymentId: "mock_payment_id",
    }
  }

  async confirmPayment(
    input: ConfirmPaymentInput
  ): Promise<ConfirmPaymentResult> {
    return {
      status: "succeeded",
      providerPaymentId: input.providerPaymentId ?? "mock_payment_id",
    }
  }
}

export function getPaymentProvider(): PaymentProvider {
  // TODO: 환경 변수 기준으로 PG 선택 (toss / iamport 등)
  return new MockPaymentProvider()
}