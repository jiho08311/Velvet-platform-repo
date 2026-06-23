import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { EarningSourceType, EarningStatus } from "@/modules/payout/types"
import type { EarningBalanceRow } from "@/modules/payout/policies/payout-balance-policy"
import type { EarningBalanceStatus } from "@/modules/payout/policies/payout-balance-policy"
export type CreatorCompactBalanceEarningRow = {
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

export type CreatorEarningsBalanceRow = EarningBalanceRow & {
  net_amount: number | null
  status: EarningStatus | "requested"
  currency: string
  payout_id: string | null
  payout_request_id: string | null
}

export type CreatorEarningRow = {
  id: string
  creator_id: string
  payment_id: string
  payout_id: string | null
  source_type: EarningSourceType
  gross_amount: number
  fee_rate_bps: number
  fee_amount: number
  net_amount: number
  currency: string
  status: EarningStatus
  available_at: string | null
  paid_out_at: string | null
  reversed_at: string | null
  created_at: string
}

export type EarningRow = CreatorEarningRow

export type PendingEarningReleaseRow = {
  id: string
  created_at: string
  available_at: string | null
}

export const EARNING_ROW_SELECT =
  "id, creator_id, payment_id, payout_id, source_type, gross_amount, fee_rate_bps, fee_amount, net_amount, currency, status, available_at, paid_out_at, reversed_at, created_at"

export async function findEarningByPaymentId(
  paymentId: string
): Promise<EarningRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_earning_state")
    .select(EARNING_ROW_SELECT)
    .eq("payment_id", paymentId)
    .maybeSingle<EarningRow>()

  if (error) {
    throw error
  }

  return data
}

export async function listCreatorCompactBalanceRows(
  creatorId: string
): Promise<CreatorCompactBalanceEarningRow[]> {
  const { data, error } = await supabaseAdmin
    .from("canonical_earning_state")
    .select("net_amount, status, payout_id, payout_request_id")
    .eq("creator_id", creatorId)
    .returns<CreatorCompactBalanceEarningRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function listCreatorEarningsBalanceRows(
  creatorId: string
): Promise<CreatorEarningsBalanceRow[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("canonical_earning_state")
    .select("net_amount, status, currency, payout_id, payout_request_id")
    .eq("creator_id", creatorId)
    .returns<CreatorEarningsBalanceRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function listCreatorEarningRows({
  creatorId,
  status,
}: {
  creatorId: string
  status?: EarningStatus
}): Promise<CreatorEarningRow[]> {
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from("canonical_earning_state")
    .select(EARNING_ROW_SELECT)
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query.returns<CreatorEarningRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function listPendingEarningRowsReadyForRelease({
  availableAtLte,
  limit,
}: {
  availableAtLte: string
  limit: number
}): Promise<PendingEarningReleaseRow[]> {
  const { data, error } = await supabaseAdmin
    .from("canonical_earning_state")
    .select("id, created_at, available_at")
    .eq("status", "pending")
    .not("available_at", "is", null)
    .lte("available_at", availableAtLte)
    .order("available_at", { ascending: true })
    .limit(limit)
    .returns<PendingEarningReleaseRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}


export type RequestableEarningRow = {
  id: string
  net_amount: number | null
  status: EarningBalanceStatus
  payout_request_id: string | null
  payout_id: string | null
}

export async function listRequestableEarningSnapshotRows(
  creatorId: string
): Promise<RequestableEarningRow[]> {
  const { data, error } = await supabaseAdmin
    .from("canonical_earning_state")
    .select("id, net_amount, status, payout_request_id, payout_id")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: true })
    .returns<RequestableEarningRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export type PayoutLinkedRequestedEarningRow = {
  id: string
  status: "pending" | "available" | "requested" | "paid_out" | "reversed"
  payout_id: string | null
  payout_request_id: string | null
  paid_out_at: string | null
}

export type PayoutRequestLinkedEarningRow = {
  id: string
  net_amount: number
  status: "pending" | "available" | "requested" | "paid_out" | "reversed"
  payout_request_id: string | null
  payout_id: string | null
}

export async function listPayoutRequestLinkedEarningRows(
  payoutRequestId: string
): Promise<PayoutRequestLinkedEarningRow[]> {
  const { data, error } = await supabaseAdmin
    .from("canonical_earning_state")
    .select("id, net_amount, status, payout_request_id, payout_id")
    .eq("payout_request_id", payoutRequestId)
    .returns<PayoutRequestLinkedEarningRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function listLinkedRequestedEarningRowsByPayoutId(
  payoutId: string
): Promise<PayoutLinkedRequestedEarningRow[]> {
  const { data, error } = await supabaseAdmin
    .from("canonical_earning_state")
    .select("id, status, payout_id, payout_request_id, paid_out_at")
    .eq("payout_id", payoutId)
    .eq("status", "requested")
    .returns<PayoutLinkedRequestedEarningRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function listPayoutLinkedEarningRowsByIds(
  earningIds: string[]
): Promise<PayoutLinkedRequestedEarningRow[]> {
  const { data, error } = await supabaseAdmin
    .from("canonical_earning_state")
    .select("id, status, payout_id, payout_request_id, paid_out_at")
    .in("id", earningIds)
    .returns<PayoutLinkedRequestedEarningRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export type PlatformRevenueEarningRow = {
  net_amount: number | null
  status: string | null
}

export async function listPlatformRevenueEarningRows(): Promise<
  PlatformRevenueEarningRow[]
> {
  const { data, error } = await supabaseAdmin
    .from("canonical_earning_state")
    .select("net_amount, status")
    .returns<PlatformRevenueEarningRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export type ListEarningRowsForReplayInput = {
  windowStart?: string | null
  windowEnd?: string | null
  limit: number
}

export async function listEarningRowsForReplay({
  windowStart,
  windowEnd,
  limit,
}: ListEarningRowsForReplayInput): Promise<EarningRow[]> {
  let query = supabaseAdmin
    .from("canonical_earning_state")
    .select(EARNING_ROW_SELECT)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(limit)

  if (windowStart) {
    query = query.gte("created_at", windowStart)
  }

  if (windowEnd) {
    query = query.lte("created_at", windowEnd)
  }

  const { data, error } = await query.returns<EarningRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}
