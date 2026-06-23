import {
  countLedgerTransactions,
  hasLedgerTransaction,
  hasRefundedPaymentForEarning,
  insertFinancialReconciliationReport,
  listPaidPayoutsForReconciliation,
  listRefundedPaymentsForReconciliation,
  listReversedEarningsForReconciliation,
  listSucceededPaymentsForReconciliation,
} from "@/modules/ledger/repositories/financial-reconciliation-repository"

type FinancialReconciliationMismatch = {
  type:
    | "missing_payment_ledger_transaction"
    | "duplicate_payment_ledger_transaction"
    | "missing_refund_ledger_transaction"
    | "duplicate_refund_ledger_transaction"
    | "missing_payout_ledger_transaction"
    | "duplicate_payout_ledger_transaction"
    | "reversed_earning_without_refunded_payment"
  entityType: "payment" | "payout" | "earning"
  entityId: string
  expected: Record<string, unknown>
  observed: Record<string, unknown>
}

type RunFinancialReconciliationInput = {
  limit?: number
}

export type RunFinancialReconciliationResult = {
  reportType: "daily_financial_reconciliation"
  checkedPayments: number
  checkedPayouts: number
  checkedEarnings: number
  mismatchCount: number
  status: "ok" | "mismatch"
  mismatches: FinancialReconciliationMismatch[]
}

async function reconcileSucceededPayments(
  limit: number
): Promise<{
  checked: number
  mismatches: FinancialReconciliationMismatch[]
}> {
  const payments = await listSucceededPaymentsForReconciliation(limit)
  const mismatches: FinancialReconciliationMismatch[] = []

  for (const payment of payments) {
    const count = await countLedgerTransactions({
      transactionType: "payment_confirmed",
      paymentId: payment.id,
    })

    if (count === 0) {
      mismatches.push({
        type: "missing_payment_ledger_transaction",
        entityType: "payment",
        entityId: payment.id,
        expected: {
          transactionType: "payment_confirmed",
          amount: payment.amount,
          currency: payment.currency,
        },
        observed: {
          transactionCount: count,
        },
      })
      continue
    }

    if (count > 1) {
      mismatches.push({
        type: "duplicate_payment_ledger_transaction",
        entityType: "payment",
        entityId: payment.id,
        expected: {
          transactionType: "payment_confirmed",
          transactionCount: 1,
        },
        observed: {
          transactionCount: count,
        },
      })
    }
  }

  return {
    checked: payments.length,
    mismatches,
  }
}

async function reconcileRefundedPayments(
  limit: number
): Promise<{
  checked: number
  mismatches: FinancialReconciliationMismatch[]
}> {
  const payments = await listRefundedPaymentsForReconciliation(limit)
  const mismatches: FinancialReconciliationMismatch[] = []

  for (const payment of payments) {
    const count = await countLedgerTransactions({
      transactionType: "refund",
      paymentId: payment.id,
    })

    if (count === 0) {
      mismatches.push({
        type: "missing_refund_ledger_transaction",
        entityType: "payment",
        entityId: payment.id,
        expected: {
          transactionType: "refund",
          amount: payment.amount,
          currency: payment.currency,
        },
        observed: {
          transactionCount: count,
        },
      })
      continue
    }

    if (count > 1) {
      mismatches.push({
        type: "duplicate_refund_ledger_transaction",
        entityType: "payment",
        entityId: payment.id,
        expected: {
          transactionType: "refund",
          transactionCount: 1,
        },
        observed: {
          transactionCount: count,
        },
      })
    }
  }

  return {
    checked: payments.length,
    mismatches,
  }
}

async function reconcilePaidPayouts(
  limit: number
): Promise<{
  checked: number
  mismatches: FinancialReconciliationMismatch[]
}> {
  const payouts = await listPaidPayoutsForReconciliation(limit)
  const mismatches: FinancialReconciliationMismatch[] = []

  for (const payout of payouts) {
    const count = await countLedgerTransactions({
      transactionType: "payout_paid",
      payoutId: payout.id,
    })

    if (count === 0) {
      mismatches.push({
        type: "missing_payout_ledger_transaction",
        entityType: "payout",
        entityId: payout.id,
        expected: {
          transactionType: "payout_paid",
          amount: payout.amount,
          currency: payout.currency,
        },
        observed: {
          transactionCount: count,
        },
      })
      continue
    }

    if (count > 1) {
      mismatches.push({
        type: "duplicate_payout_ledger_transaction",
        entityType: "payout",
        entityId: payout.id,
        expected: {
          transactionType: "payout_paid",
          transactionCount: 1,
        },
        observed: {
          transactionCount: count,
        },
      })
    }
  }

  return {
    checked: payouts.length,
    mismatches,
  }
}

async function reconcileReversedEarnings(
  limit: number
): Promise<{
  checked: number
  mismatches: FinancialReconciliationMismatch[]
}> {
  const earnings = await listReversedEarningsForReconciliation(limit)
  const mismatches: FinancialReconciliationMismatch[] = []

  for (const earning of earnings) {
    const hasRefundedPayment = await hasRefundedPaymentForEarning(
      earning.payment_id
    )

    if (!hasRefundedPayment) {
      mismatches.push({
        type: "reversed_earning_without_refunded_payment",
        entityType: "earning",
        entityId: earning.id,
        expected: {
          paymentStatus: "refunded",
          paymentId: earning.payment_id,
        },
        observed: {
          earningStatus: earning.status,
          reversedAt: earning.reversed_at,
        },
      })
    }
  }

  return {
    checked: earnings.length,
    mismatches,
  }
}

export async function runFinancialReconciliation(
  input: RunFinancialReconciliationInput = {}
): Promise<RunFinancialReconciliationResult> {
  const limit = input.limit ?? 500

  const [
    succeededPayments,
    refundedPayments,
    paidPayouts,
    reversedEarnings,
  ] = await Promise.all([
    reconcileSucceededPayments(limit),
    reconcileRefundedPayments(limit),
    reconcilePaidPayouts(limit),
    reconcileReversedEarnings(limit),
  ])

  const mismatches = [
    ...succeededPayments.mismatches,
    ...refundedPayments.mismatches,
    ...paidPayouts.mismatches,
    ...reversedEarnings.mismatches,
  ]

  const result: RunFinancialReconciliationResult = {
    reportType: "daily_financial_reconciliation",
    checkedPayments: succeededPayments.checked + refundedPayments.checked,
    checkedPayouts: paidPayouts.checked,
    checkedEarnings: reversedEarnings.checked,
    mismatchCount: mismatches.length,
    status: mismatches.length === 0 ? "ok" : "mismatch",
    mismatches,
  }

  await insertFinancialReconciliationReport({
    reportType: result.reportType,
    checkedPayments: result.checkedPayments,
    checkedPayouts: result.checkedPayouts,
    checkedEarnings: result.checkedEarnings,
    mismatchCount: result.mismatchCount,
    status: result.status,
    metadata: {
      limit,
      mismatches,
    },
  })

  return result
}