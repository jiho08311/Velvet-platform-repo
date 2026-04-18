import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { resolvePayoutBalanceTotals } from "@/modules/payout/lib/payout-balance-policy"

type GetCreatorBalanceParams = {
  creatorId: string
}

type EarningRow = {
  net_amount: number | null
  status:
    | "pending"
    | "available"
    | "requested"
    | "paid_out"
    | "reversed"
  payout_id: string | null
  payout_request_id: string | null
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
  const { data: earnings, error: earningsError } = await supabaseAdmin
    .from("earnings")
    .select("net_amount, status, payout_id, payout_request_id")
    .eq("creator_id", creatorId)
    .returns<EarningRow[]>()

  if (earningsError) {
    throw earningsError
  }

  const rows = earnings ?? []
  const totals = resolvePayoutBalanceTotals(rows)

  const totalEarnings = rows.reduce((sum, earning) => {
    if (earning.status === "reversed") {
      return sum
    }

    return sum + (earning.net_amount ?? 0)
  }, 0)

  const totalPayouts = totals.paidOutAmount

  return {
    creatorId,
    totalEarnings,
    totalPayouts,
    availableBalance: totals.requestableAmount,
  }
}