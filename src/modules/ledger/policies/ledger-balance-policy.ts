import type { LedgerCreatorBalanceRow } from "@/modules/ledger/repositories/ledger-balance-repository"

export type LedgerCreatorBalanceTotals = {
  currency: string
  totalEarnings: number
  totalPayouts: number
  pendingAmount: number
  availableAmount: number
  requestedAmount: number
  paidOutAmount: number
  reversedAmount: number
  requestableAmount: number
}

function toAmount(value: number | null | undefined): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, value ?? 0)
}

export function resolveLedgerCreatorBalanceTotals(
  row: LedgerCreatorBalanceRow | null
): LedgerCreatorBalanceTotals {
  const receivableCredit = toAmount(row?.receivable_credit)
  const receivableDebit = toAmount(row?.receivable_debit)

  const payableCredit = toAmount(row?.payable_credit)
  const payableDebit = toAmount(row?.payable_debit)

  const cashCredit = toAmount(row?.cash_credit)

  const availableAmount = Math.max(0, receivableCredit - receivableDebit)
  const requestedAmount = Math.max(0, payableCredit - payableDebit)
  const paidOutAmount = cashCredit

  return {
    currency: row?.currency ?? "KRW",
    totalEarnings: receivableCredit,
    totalPayouts: paidOutAmount,
    pendingAmount: 0,
    availableAmount,
    requestedAmount,
    paidOutAmount,
    reversedAmount: 0,
    requestableAmount: availableAmount,
  }
}