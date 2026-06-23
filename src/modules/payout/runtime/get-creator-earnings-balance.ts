import type { CreatorEarningsBalance } from "../types"
import { resolveLedgerCreatorBalanceTotals } from "@/modules/ledger/public/ledger-balance-policy"
import { getLedgerCreatorBalanceRow } from "@/modules/ledger/public/creator-balance-read-model"

type GetCreatorEarningsBalanceInput = {
  creatorId: string
}

export type CreatorResolvedEarningsBalance = CreatorEarningsBalance & {
  requestedamount: number
  requestableamount: number
}

export async function getCreatorEarningsBalance({
  creatorId,
}: GetCreatorEarningsBalanceInput): Promise<CreatorResolvedEarningsBalance | null> {
  const id = creatorId.trim()

  if (!id) {
    return null
  }

  const row = await getLedgerCreatorBalanceRow(id)
  const totals = resolveLedgerCreatorBalanceTotals(row)

  return {
    creatorId: id,
    currency: totals.currency,
    pendingamount: totals.pendingAmount,
    availableamount: totals.availableAmount,
    requestedamount: totals.requestedAmount,
    requestableamount: totals.requestableAmount,
    paidOutamount: totals.paidOutAmount,
    reversedamount: totals.reversedAmount,
  }
}
