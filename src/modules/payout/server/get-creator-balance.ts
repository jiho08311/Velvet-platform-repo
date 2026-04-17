import { supabaseAdmin } from "@/infrastructure/supabase/admin"

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
    .select("net_amount, status")
    .eq("creator_id", creatorId)
    .returns<EarningRow[]>()

  if (earningsError) {
    throw earningsError
  }

  const rows = earnings ?? []

  const totalEarnings = rows.reduce((sum, earning) => {
    if (earning.status === "reversed") {
      return sum
    }

    return sum + (earning.net_amount ?? 0)
  }, 0)

  const totalPayouts = rows.reduce((sum, earning) => {
    if (earning.status !== "paid_out") {
      return sum
    }

    return sum + (earning.net_amount ?? 0)
  }, 0)

  const availableBalance = rows.reduce((sum, earning) => {
    if (earning.status !== "available") {
      return sum
    }

    return sum + (earning.net_amount ?? 0)
  }, 0)

  return {
    creatorId,
    totalEarnings,
    totalPayouts,
    availableBalance,
  }
}