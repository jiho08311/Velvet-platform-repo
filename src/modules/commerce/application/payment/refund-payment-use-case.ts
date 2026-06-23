import { refundCanonicalPayment } from "@/modules/commerce/internal/adapters/payment-adapter"
import { getPaymentUseCase } from "@/modules/commerce/application/payment/get-payment-use-case"
import type {
  RefundPaymentInput,
  RefundPaymentResult,
} from "@/modules/commerce/public/payment-contract"

export async function refundPaymentUseCase(
  input: RefundPaymentInput
): Promise<RefundPaymentResult> {
  await refundCanonicalPayment({
    paymentId: input.paymentId,
  })

  const { payment } = await getPaymentUseCase({
    paymentId: input.paymentId,
  })

  if (!payment || payment.status !== "refunded") {
    throw new Error("PAYMENT_REFUND_POSTCONDITION_FAILED")
  }

  return {
    payment: {
      ...payment,
      status: "refunded",
      refundedAt: payment.refundedAt ?? new Date().toISOString(),
    },
    effects: {
      earningReversal: "completed",
      subscriptionExpiry:
        payment.purpose === "subscription" ? "completed" : "not_applicable",
    },
  }
}