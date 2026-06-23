import type { RefundPaymentInput } from "@/modules/payment/contracts/payment-refund-contract"
import {
  findPaymentForRefundById,
} from "@/modules/payment/repositories/payment-read-repository"

import {
  markPaymentRefundedIfSucceeded,
} from "@/modules/payment/repositories/payment-write-repository"
import {
  createRefundLedgerSideEffect,
  executeRefundPostmarkSideEffects,
  expireSubscriptionAfterRefund,
} from "./payment-refund-side-effects"



export type { RefundPaymentInput } from "@/modules/payment/contracts/payment-refund-contract"

export async function executePaymentRefund({
  paymentId,
}: RefundPaymentInput): Promise<void> {
  const safePaymentId = paymentId.trim()

  if (!safePaymentId) {
    throw new Error("Invalid payment id")
  }

  const payment = await findPaymentForRefundById(safePaymentId)

  if (!payment) {
    throw new Error("PAYMENT_NOT_FOUND")
  }

  if (payment.status === "refunded") {
    return
  }

  if (payment.status !== "succeeded") {
    throw new Error("PAYMENT_NOT_REFUNDABLE")
  }

  const now = new Date().toISOString()

  const refundLedgerResult = await createRefundLedgerSideEffect({
    payment,
    refundedAt: now,
  })

  await markPaymentRefundedIfSucceeded({
    paymentId: payment.id,
    refundedAt: now,
  })

  await executeRefundPostmarkSideEffects({
    payment,
    refundedAt: now,
    refundLedgerResult,
  })

  await expireSubscriptionAfterRefund({
    payment,
    refundedAt: now,
    refundLedgerResult,
  })
}
