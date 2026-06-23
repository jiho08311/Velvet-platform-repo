export type HandlePaymentFailureInput = {
  paymentId: string
  failureReason: string
}

export type FailedPayment = {
  id: string
  status: "failed"
  failureReason: string
  failedAt: string
}

export type PaymentFailureAssemblyResult = FailedPayment
