export type PaymentProviderName = "mock" | "toss"

export type CreateProviderCheckoutInput = {
  paymentId: string
  orderId: string
  orderName: string
  amountCents: number
  customerEmail?: string
  successUrl: string
  failUrl: string
}

export type CreateProviderCheckoutResult = {
  provider: PaymentProviderName
  checkoutUrl: string | null
  providerReferenceId?: string
}

export type ConfirmProviderPaymentInput = {
  paymentId: string
  providerReferenceId?: string
}

export type ConfirmProviderPaymentResult = {
  provider: PaymentProviderName
  status: "succeeded" | "failed"
  providerReferenceId?: string
}

export interface PaymentProvider {
  name: PaymentProviderName
  createCheckout(
    input: CreateProviderCheckoutInput
  ): Promise<CreateProviderCheckoutResult>
  confirmPayment(
    input: ConfirmProviderPaymentInput
  ): Promise<ConfirmProviderPaymentResult>
}