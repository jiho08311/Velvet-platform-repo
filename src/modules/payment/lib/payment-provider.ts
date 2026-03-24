export type CreatePaymentInput = {
  paymentId: string
  orderId: string
  orderName: string
  amount: number
  currency: string
  customerId: string
  customerEmail?: string | null
  successUrl: string
  cancelUrl: string
  failUrl: string
}

export type CreatePaymentResult = {
  checkoutUrl: string
  providerPaymentId?: string | null
}

export type ConfirmPaymentInput = {
  paymentId: string
  providerPaymentId?: string | null
  amount?: number | null
}

export type ConfirmPaymentResult = {
  status: "succeeded" | "failed" | "canceled" | "pending"
  providerPaymentId?: string | null
  raw?: unknown
}

export interface PaymentProvider {
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>
  confirmPayment(input: ConfirmPaymentInput): Promise<ConfirmPaymentResult>
}