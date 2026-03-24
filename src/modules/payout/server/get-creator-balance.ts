import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type GetCreatorBalanceParams = {
  creatorId: string
}

type EarningRow = {
  net_amount_cents: number | null
  status: "pending" | "available" | "paid_out" | "reversed"
}

export type CreatorBalance = {
  creatorId: string
  totalEarningsCents: number
  totalPayoutsCents: number
  availableBalanceCents: number
}

export async function getCreatorBalance({
  creatorId,
}: GetCreatorBalanceParams): Promise<CreatorBalance> {
  const supabase = await createSupabaseServerClient()

  const { data: earnings, error: earningsError } = await supabase
    .from("earnings")
    .select("net_amount_cents, status")
    .eq("creator_id", creatorId)
    .returns<EarningRow[]>()

  if (earningsError) {
    throw earningsError
  }

  const rows = earnings ?? []

  const totalEarningsCents = rows.reduce((sum, earning) => {
    if (earning.status === "reversed") {
      return sum
    }

    return sum + (earning.net_amount_cents ?? 0)
  }, 0)

  const totalPayoutsCents = rows.reduce((sum, earning) => {
    if (earning.status !== "paid_out") {
      return sum
    }

    return sum + (earning.net_amount_cents ?? 0)
  }, 0)

  const availableBalanceCents = rows.reduce((sum, earning) => {
    if (earning.status !== "available") {
      return sum
    }

    return sum + (earning.net_amount_cents ?? 0)
  }, 0)

  return {
    creatorId,
    totalEarningsCents,
    totalPayoutsCents,
    availableBalanceCents,
  }
}