import type { PaymentFanoutResult } from "@/modules/payment/contracts/payment-confirmation-contract"
import { isSettlablePaymentType } from "@/modules/payment/policies/payment-type-policy"
import type { PaymentType } from "@/modules/payment/types"
import { createPaymentConfirmedLedgerTransaction } from "@/modules/ledger/public/create-payment-confirmed-ledger-transaction"
import { createEarning } from "@/modules/payout/public/create-earning"
import { InfrastructureError } from "@/shared/errors"
import { createAndTraceSilentFailureEvent } from "@/shared/observability/silent-failure-event"

export async function processPaymentConfirmationSettlement(payment: {
  id: string
  creator_id: string | null
  type: PaymentType
  amount: number
  currency: string | null
  confirmed_at: string | null
}): Promise<PaymentFanoutResult> {
  if (!isSettlablePaymentType(payment.type)) {
    return {
      fanoutStatus: "skipped",
      sideEffectStatus: "skipped",
      metadata: {
        skipReason: "payment_type_not_settlable",
      },
    }
  }

  try {
    const ledgerTransaction = await createPaymentConfirmedLedgerTransaction({
      paymentId: payment.id,
      creatorId: payment.creator_id,
      type: payment.type,
      amount: payment.amount,
      currency: payment.currency,
      confirmedAt: payment.confirmed_at ?? new Date().toISOString(),
    })

    const earning = await createEarning({
      paymentId: payment.id,
    })

    return {
      fanoutStatus: earning ? "observed" : "skipped",
      sideEffectStatus: earning ? "observed" : "skipped",
      sideEffectTable: earning ? "earnings" : null,
      sideEffectRowId: earning?.id ?? null,
      metadata: {
        creatorId: payment.creator_id,
        ledgerTransactionId: ledgerTransaction?.id ?? null,
        ledgerObserved: ledgerTransaction != null,
        earningObserved: earning != null,
        earningMode: "legacy_compatibility_projection",
      },
    }
  } catch (error) {
    createAndTraceSilentFailureEvent({
      category: "financial_side_effect_swallowed",
      severity: "critical",
      failureMode: "catch_console_error_only",
      provenance: {
        sourceFile:
          "src/modules/payment/services/payment-confirmation-service.ts",
        operationName: "processSettlement",
        domain: "settlement",
        actorType: "system",
        authorityScope: {
          authority: "financial.side_effect",
          resourceType: "payment",
          resourceId: payment.id,
        },
      },
      ignoredExecution: {
        ignored: false,
        mechanism: "catch_fallback",
        rejectionObserved: true,
      },
      error,
      metadata: {
        paymentId: payment.id,
        creatorId: payment.creator_id,
        type: payment.type,
        ledgerRequired: true,
        earningMode: "legacy_compatibility_projection",
        failureMode: "financial_side_effect_failed",
      },
    })

    throw new InfrastructureError("PAYMENT_SETTLEMENT_FAILED", {
      cause: error,
      metadata: {
        paymentId: payment.id,
        creatorId: payment.creator_id,
        type: payment.type,
        ledgerRequired: true,
      },
    })
  }
}
