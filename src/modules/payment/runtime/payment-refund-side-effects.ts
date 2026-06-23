import { recordFinancialOperationAudit as createAuditLog } from "@/modules/governance/public/audit-contract"
import { createRefundLedgerAdjustment } from "@/modules/ledger/public/create-refund-ledger-adjustment"
import { reverseEarning } from "@/modules/payout/public/reverse-earning"
import { expireActiveCreatorSubscription } from "@/modules/subscription/public/expire-subscriptions"
import { InfrastructureError } from "@/shared/errors"
import { createAndTraceRefund } from "@/shared/observability/refund-trace"
import type { RefundablePaymentRow } from "./payment-refund-types"

export async function createRefundLedgerSideEffect(input: {
  payment: RefundablePaymentRow
  refundedAt: string
}) {
  const { payment, refundedAt } = input

  const refundLedgerResult = await createRefundLedgerAdjustment({
    paymentId: payment.id,
    creatorId: payment.creator_id,
    userId: payment.user_id,
    type: payment.type,
    amount: payment.amount,
    currency: payment.currency,
    refundedAt,
    reason: "payment_refund",
  })

  return refundLedgerResult
}

export async function executeRefundPostmarkSideEffects(input: {
  payment: RefundablePaymentRow
  refundedAt: string
  refundLedgerResult: Awaited<ReturnType<typeof createRefundLedgerSideEffect>>
}) {
  const { payment, refundedAt, refundLedgerResult } = input

  createAndTraceRefund({
    phase: "payment_refunded",
    authority: "payment_refund",
    paymentId: payment.id,
    actor: {
      actorType: "user",
      actorId: payment.user_id,
    },
    source: {
      sourceFile: "src/modules/payment/runtime/execute-payment-refund.ts",
      operationName: "executePaymentRefund",
    },
    metadata: {
      paymentId: payment.id,
      userId: payment.user_id,
      creatorId: payment.creator_id,
      type: payment.type,
      refundedAt,
      ledgerAdjustmentId: refundLedgerResult.adjustment.id,
      ledgerAdjustmentTransactionId:
        refundLedgerResult.adjustmentTransaction.id,
      refundEventId: refundLedgerResult.refundEvent.id,
    },
  })

  await reverseEarning({
    paymentId: payment.id,
  })

  createAndTraceRefund({
    phase: "earning_reversed",
    authority: "earning_reversal",
    paymentId: payment.id,
    actor: {
      actorType: "user",
      actorId: payment.user_id,
    },
    source: {
      sourceFile: "src/modules/payment/runtime/execute-payment-refund.ts",
      operationName: "executePaymentRefund",
    },
    metadata: {
      paymentId: payment.id,
      userId: payment.user_id,
      creatorId: payment.creator_id,
      type: payment.type,
    },
  })

  await createAuditLog({
    actorId: payment.user_id,
    action: "payment_refunded",
    targetType: "payment",
    targetId: payment.id,
    metadata: {
      paymentId: payment.id,
      userId: payment.user_id,
      creatorId: payment.creator_id,
      type: payment.type,
      refundedAt,
      ledgerAdjustmentId: refundLedgerResult.adjustment.id,
      ledgerAdjustmentTransactionId:
        refundLedgerResult.adjustmentTransaction.id,
      refundEventId: refundLedgerResult.refundEvent.id,
    },
  })
}

export async function expireSubscriptionAfterRefund(input: {
  payment: RefundablePaymentRow
  refundedAt: string
  refundLedgerResult: Awaited<ReturnType<typeof createRefundLedgerSideEffect>>
}) {
  const { payment, refundedAt, refundLedgerResult } = input

  if (payment.type !== "subscription" || !payment.creator_id) {
    return
  }

  try {
    await expireActiveCreatorSubscription({
      userId: payment.user_id,
      creatorId: payment.creator_id,
      canceledAt: refundedAt,
      updatedAt: refundedAt,
    })
  } catch (error) {
    throw new InfrastructureError(
      "SUBSCRIPTION_EXPIRATION_AFTER_REFUND_FAILED",
      {
        cause: error,
        metadata: {
          paymentId: payment.id,
          userId: payment.user_id,
          creatorId: payment.creator_id,
          refundedAt,
          ledgerAdjustmentId: refundLedgerResult.adjustment.id,
          ledgerAdjustmentTransactionId:
            refundLedgerResult.adjustmentTransaction.id,
          refundEventId: refundLedgerResult.refundEvent.id,
        },
      }
    )
  }
}
