export type RefundPaymentInput = {
  paymentId: string
}

export type PaymentRefundAssemblyResult = {
  payment: {
    paymentId: string
    status: "refunded" | "already_refunded"
    refundedAt: string | null
  }
  earningReversal: {
    status: "observed" | "skipped" | "failed"
    paymentId: string
  }
  subscriptionExpiry: {
    status: "observed" | "skipped" | "failed"
    subscriptionId: string | null
  }
}
