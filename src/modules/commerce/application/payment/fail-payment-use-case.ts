import { failCanonicalPayment } from "@/modules/commerce/internal/adapters/payment-adapter"
import { getPaymentUseCase } from "@/modules/commerce/application/payment/get-payment-use-case"
import type {
  FailPaymentInput,
  FailPaymentResult,
} from "@/modules/commerce/public/payment-contract"

export async function failPaymentUseCase(
  input: FailPaymentInput
): Promise<FailPaymentResult> {
  const failed = await failCanonicalPayment({
    paymentId: input.paymentId,
    failureReason: input.failureReason,
  })

  if (!failed) {
    throw new Error("PAYMENT_NOT_FOUND")
  }

  const { payment } = await getPaymentUseCase({
    paymentId: failed.id,
  })

  if (!payment || payment.status !== "failed") {
    throw new Error("PAYMENT_FAILURE_POSTCONDITION_FAILED")
  }

  return {
    payment: {
      ...payment,
      status: "failed",
      failedAt: failed.failedAt,
    },
    failureReason: failed.failureReason,
  }
}