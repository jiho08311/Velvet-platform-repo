import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

import type { CreatorEarningsBalance, EarningStatus } from "../types"
import { resolvePayoutBalanceTotals } from "@/modules/payout/lib/payout-balance-policy"

type GetCreatorEarningsBalanceInput = {
  creatorId: string
}

type EarningAmountRow = {
  net_amount: number | null
  status: EarningStatus | "requested"
  currency: string
  payout_id: string | null
  payout_request_id: string | null
}

export type CreatorResolvedEarningsBalance = CreatorEarningsBalance & {
  requestedamount: number
  requestableamount: number
}

export async function getCreatorEarningsBalance({
  creatorId,
}: GetCreatorEarningsBalanceInput): Promise<CreatorResolvedEarningsBalance | null> {
  const supabase = await createSupabaseServerClient()

  const id = creatorId.trim()

  if (!id) {
    return null
  }

  const { data, error } = await supabase
    .from("earnings")
    .select("net_amount, status, currency, payout_id, payout_request_id")
    .eq("creator_id", id)
    .returns<EarningAmountRow[]>()

  if (error) {
    throw error
  }

  const rows = data ?? []
  const totals = resolvePayoutBalanceTotals(rows)

  return {
    creatorId: id,
    currency: rows[0]?.currency ?? "KRW",
    pendingamount: totals.pendingAmount,
    availableamount: totals.availableAmount,
    requestedamount: totals.requestedAmount,
    requestableamount: totals.requestableAmount,
    paidOutamount: totals.paidOutAmount,
    reversedamount: totals.reversedAmount,
  }
}