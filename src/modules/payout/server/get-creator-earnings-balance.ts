import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

import type { CreatorEarningsBalance, EarningStatus } from "../types"

type GetCreatorEarningsBalanceInput = {
  creatorId: string
}

type EarningAmountRow = {
  net_amount: number | null
  status: EarningStatus
  currency: string
}

export async function getCreatorEarningsBalance({
  creatorId,
}: GetCreatorEarningsBalanceInput): Promise<CreatorEarningsBalance | null> {
  const supabase = await createSupabaseServerClient()

  const id = creatorId.trim()

  if (!id) {
    return null
  }

  const { data, error } = await supabase
    .from("earnings")
    .select("net_amount, status, currency")
    .eq("creator_id", id)
    .returns<EarningAmountRow[]>()

  if (error) {
    throw error
  }

  const rows = data ?? []

  let pendingamount = 0
  let availableamount = 0
  let paidOutamount = 0
  let reversedamount = 0

  for (const row of rows) {
    const amount = row.net_amount ?? 0

    if (row.status === "pending") {
      pendingamount += amount
      continue
    }

    if (row.status === "available") {
      availableamount += amount
      continue
    }

    if (row.status === "paid_out") {
      paidOutamount += amount
      continue
    }

    if (row.status === "reversed") {
      reversedamount += amount
    }
  }

  return {
    creatorId: id,
    currency: rows[0]?.currency ?? "KRW",
    pendingamount,
    availableamount,
    paidOutamount,
    reversedamount,
  }
}