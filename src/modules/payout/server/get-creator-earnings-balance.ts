import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

import type { CreatorEarningsBalance, EarningStatus } from "../types"

type GetCreatorEarningsBalanceInput = {
  creatorId: string
}

type EarningAmountRow = {
  net_amount_cents: number | null
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
    .select("net_amount_cents, status, currency")
    .eq("creator_id", id)
    .returns<EarningAmountRow[]>()

  if (error) {
    throw error
  }

  const rows = data ?? []

  let pendingAmountCents = 0
  let availableAmountCents = 0
  let paidOutAmountCents = 0
  let reversedAmountCents = 0

  for (const row of rows) {
    const amount = row.net_amount_cents ?? 0

    if (row.status === "pending") {
      pendingAmountCents += amount
      continue
    }

    if (row.status === "available") {
      availableAmountCents += amount
      continue
    }

    if (row.status === "paid_out") {
      paidOutAmountCents += amount
      continue
    }

    if (row.status === "reversed") {
      reversedAmountCents += amount
    }
  }

  return {
    creatorId: id,
    currency: rows[0]?.currency ?? "KRW",
    pendingAmountCents,
    availableAmountCents,
    paidOutAmountCents,
    reversedAmountCents,
  }
}