import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

import type { Earning, EarningSourceType, EarningStatus } from "../types"

type ListCreatorEarningsInput = {
  creatorId: string
  status?: EarningStatus
}

type EarningRow = {
  id: string
  creator_id: string
  payment_id: string
  payout_id: string | null
  source_type: EarningSourceType
  gross_amount_cents: number
  fee_rate_bps: number
  fee_amount_cents: number
  net_amount_cents: number
  currency: string
  status: EarningStatus
  available_at: string | null
  paid_out_at: string | null
  reversed_at: string | null
  created_at: string
}

function toEarning(row: EarningRow): Earning {
  return {
    id: row.id,
    creatorId: row.creator_id,
    paymentId: row.payment_id,
    payoutId: row.payout_id,
    sourceType: row.source_type,
    grossAmountCents: row.gross_amount_cents,
    feeRateBps: row.fee_rate_bps,
    feeAmountCents: row.fee_amount_cents,
    netAmountCents: row.net_amount_cents,
    currency: row.currency,
    status: row.status,
    availableAt: row.available_at,
    paidOutAt: row.paid_out_at,
    reversedAt: row.reversed_at,
    createdAt: row.created_at,
  }
}

export async function listCreatorEarnings({
  creatorId,
  status,
}: ListCreatorEarningsInput): Promise<Earning[]> {
  const supabase = await createSupabaseServerClient()

  const id = creatorId.trim()

  if (!id) {
    return []
  }

  let query = supabase
    .from("earnings")
    .select(
      "id, creator_id, payment_id, payout_id, source_type, gross_amount_cents, fee_rate_bps, fee_amount_cents, net_amount_cents, currency, status, available_at, paid_out_at, reversed_at, created_at"
    )
    .eq("creator_id", id)
    .order("created_at", { ascending: false })

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query.returns<EarningRow[]>()

  if (error) {
    throw error
  }

  return (data ?? []).map(toEarning)
}