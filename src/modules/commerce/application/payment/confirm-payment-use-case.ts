import { confirmCanonicalPayment } from "@/modules/commerce/internal/adapters/payment-adapter"
import { getPaymentUseCase } from "@/modules/commerce/application/payment/get-payment-use-case"
import type {
  ConfirmPaymentInput,
  ConfirmPaymentResult,
} from "@/modules/commerce/public/payment-contract"

export async function confirmPaymentUseCase(
  input: ConfirmPaymentInput
): Promise<ConfirmPaymentResult> {
  const confirmed = await confirmCanonicalPayment({
    paymentId: input.paymentId,
    paymentKey: input.paymentKey,
    orderId: input.orderId,
    amount: input.amount,
  })

  if (!confirmed) {
    throw new Error("PAYMENT_NOT_FOUND")
  }

  const { payment } = await getPaymentUseCase({
    paymentId: confirmed.id,
  })

  if (!payment || payment.status !== "succeeded" || !payment.confirmedAt) {
    throw new Error("PAYMENT_CONFIRMATION_POSTCONDITION_FAILED")
  }

  return {
    payment: {
      ...payment,
      status: "succeeded",
      confirmedAt: payment.confirmedAt,
    },
    idempotency: {
      duplicateDetected: false,
    },
    effects: {
      subscriptionActivation: "completed",
      earningCreation: "completed",
      notification: "completed",
    },
  }
}