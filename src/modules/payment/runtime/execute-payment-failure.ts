import { isTerminalFailedPaymentStatus } from "@/modules/payment/policies/payment-status-policy"
import { findPaymentForFailureById } from "@/modules/payment/repositories/payment-read-repository"
import { markPaymentFailed } from "@/modules/payment/repositories/payment-write-repository"
import type {
  FailedPayment,
  HandlePaymentFailureInput,
} from "@/modules/payment/contracts/payment-failure-contract"
import { InfrastructureError } from "@/shared/errors"

import { recordFinancialOperationAudit as createAuditLog } from "@/modules/governance/public/audit-contract"
import type { RefundPaymentInput } from "@/modules/payment/contracts/payment-refund-contract"

import {
  findPaymentForRefundById,
} from "@/modules/payment/repositories/payment-read-repository"

import {
  markPaymentRefundedIfSucceeded,
} from "@/modules/payment/repositories/payment-write-repository"

import { reverseEarning } from "@/modules/payout/public/reverse-earning"

import {
  expireActiveCreatorSubscription,
} from "@/modules/subscription/public/expire-subscriptions"

import { createAndTraceRefund } from "@/shared/observability/refund-trace"



export type {
  FailedPayment,
  HandlePaymentFailureInput,
} from "@/modules/payment/contracts/payment-failure-contract"
export async function executePaymentFailure(
  input: HandlePaymentFailureInput
): Promise<FailedPayment | null> {
  const paymentId = input.paymentId.trim()
  const failureReason = input.failureReason.trim()

if (!paymentId) {
  throw new InfrastructureError(
    "PAYMENT_FAILURE_PAYMENT_ID_REQUIRED"
  )
}

  if (!failureReason) {
    throw new Error("Failure reason is required")
  }

  const failedAt = new Date().toISOString()

  const payment = await findPaymentForFailureById(paymentId)

  if (payment) {
    if (!isTerminalFailedPaymentStatus(payment.status)) {
      await markPaymentFailed({
        paymentId: payment.id,
        failedAt,
      })

    }
  }



  return {
    id: paymentId,
    status: "failed",
    failureReason,
    failedAt,
  }
}
