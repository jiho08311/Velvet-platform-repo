import { resolveLedgerCreatorBalanceTotals } from "@/modules/ledger/public/ledger-balance-policy"
import { getLedgerCreatorBalanceRow } from "@/modules/ledger/public/creator-balance-read-model"

type GetCreatorBalanceParams = {
  creatorId: string
}

export type CreatorBalance = {
  creatorId: string
  totalEarnings: number
  totalPayouts: number
  availableBalance: number
}

export async function getCreatorBalance({
  creatorId,
}: GetCreatorBalanceParams): Promise<CreatorBalance> {
  const row = await getLedgerCreatorBalanceRow(creatorId)
  const totals = resolveLedgerCreatorBalanceTotals(row)

  return {
    creatorId,
    totalEarnings: totals.totalEarnings,
    totalPayouts: totals.totalPayouts,
    availableBalance: totals.requestableAmount,
  }
}
