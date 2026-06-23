import type { LedgerPlatformRevenueRow } from "@/modules/ledger/repositories/ledger-revenue-repository"
import type { PlatformRevenueSummary } from "@/modules/payout/types"

function toAmount(value: number | null | undefined): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, value ?? 0)
}

export function resolveLedgerPlatformRevenueSummary(
  row: LedgerPlatformRevenueRow
): PlatformRevenueSummary {
  const platformRevenueCredit = toAmount(row.platform_revenue_credit)
  const platformRevenueDebit = toAmount(row.platform_revenue_debit)

  const creatorReceivableCredit = toAmount(row.creator_receivable_credit)
  const creatorReceivableDebit = toAmount(row.creator_receivable_debit)

  const cashCredit = toAmount(row.cash_credit)

  return {
    totalNetrevenue: Math.max(
      0,
      creatorReceivableCredit - creatorReceivableDebit
    ),
    availablerevenue: Math.max(
      0,
      creatorReceivableCredit - creatorReceivableDebit
    ),
    paidOutrevenue: cashCredit,
  }
}