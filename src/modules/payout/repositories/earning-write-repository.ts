import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import {
  EARNING_ROW_SELECT,
  type EarningRow,
} from "@/modules/payout/repositories/earning-read-repository"
import type { EarningSourceType } from "@/modules/payout/types"

export type EarningCreationInsertPayload = {
  creator_id: string
  payment_id: string
  payout_id: null
  source_type: EarningSourceType
  gross_amount: number
  fee_rate_bps: number
  fee_amount: number
  net_amount: number
  currency: string
  status: "pending"
  available_at: string
  paid_out_at: null
  reversed_at: null
  created_at: string
}

export async function insertEarningCreationRow(
  payload: EarningCreationInsertPayload
): Promise<EarningRow> {
  const { data, error } = await supabaseAdmin
    .from("canonical_earning_state")
    .insert(payload)
    .select(EARNING_ROW_SELECT)
    .single<EarningRow>()

  if (error) {
    throw error
  }

  return data
}

export async function markPendingEarningRowAsAvailable({
  earningId,
  availableAt,
}: {
  earningId: string
  availableAt: string
}): Promise<EarningRow | null> {
  const { data, error } = await supabaseAdmin
    .from("canonical_earning_state")
    .update({
      status: "available",
      available_at: availableAt,
    })
    .eq("id", earningId)
    .eq("status", "pending")
    .select(EARNING_ROW_SELECT)
    .maybeSingle<EarningRow>()

  if (error) {
    throw error
  }

  if (data) {
    return data
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("canonical_earning_state")
    .select(EARNING_ROW_SELECT)
    .eq("id", earningId)
    .maybeSingle<EarningRow>()

  if (existingError) {
    throw existingError
  }

  if (!existing) {
    return null
  }

  return existing.status === "available" ? existing : null
}

export async function lockEarningRowsForPayoutRequest({
  creatorId,
  payoutRequestId,
  earningIds,
}: {
  creatorId: string
  payoutRequestId: string
  earningIds: string[]
}): Promise<{ id: string }[]> {
  const { data, error } = await supabaseAdmin
    .from("canonical_earning_state")
    .update({
      status: "requested",
      payout_request_id: payoutRequestId,
    })
    .in("id", earningIds)
    .eq("creator_id", creatorId)
    .is("payout_id", null)
    .is("payout_request_id", null)
    .eq("status", "available")
    .select("id")

  if (error) {
    throw error
  }

  return data ?? []
}

export type LinkedRequestedEarningRow = {
  id: string
  status: "pending" | "available" | "requested" | "paid_out" | "reversed"
  payout_id: string | null
  payout_request_id: string | null
  paid_out_at: string | null
}

export async function listLinkedRequestedEarningRows(
  payoutRequestId: string
): Promise<LinkedRequestedEarningRow[]> {
  const { data, error } = await supabaseAdmin
    .from("canonical_earning_state")
    .select("id, status, payout_id, payout_request_id, paid_out_at")
    .eq("payout_request_id", payoutRequestId)
    .eq("status", "requested")
    .returns<LinkedRequestedEarningRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function releaseRequestedEarningRowsForPayoutRequest({
  payoutRequestId,
  earningIds,
}: {
  payoutRequestId: string
  earningIds: string[]
}): Promise<Array<{ id: string }>> {
  const { data, error } = await supabaseAdmin
    .from("canonical_earning_state")
    .update({
      status: "available",
      payout_request_id: null,
      payout_id: null,
      paid_out_at: null,
    })
    .in("id", earningIds)
    .eq("status", "requested")
    .eq("payout_request_id", payoutRequestId)
    .select("id")
    .returns<Array<{ id: string }>>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function listEarningRowsByIds(
  earningIds: string[]
): Promise<LinkedRequestedEarningRow[]> {
  const { data, error } = await supabaseAdmin
    .from("canonical_earning_state")
    .select("id, status, payout_id, payout_request_id, paid_out_at")
    .in("id", earningIds)
    .returns<LinkedRequestedEarningRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function markEarningRowsAsPaidOutForPayout({
  earningIds,
  paidOutAt,
}: {
  earningIds: string[]
  paidOutAt: string
}): Promise<Array<{ id: string }>> {
  const { data, error } = await supabaseAdmin
    .from("canonical_earning_state")
    .update({
      status: "paid_out",
      paid_out_at: paidOutAt,
    })
    .in("id", earningIds)
    .eq("status", "requested")
    .select("id")
    .returns<Array<{ id: string }>>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function releaseEarningRowsForFailedPayout(
  earningIds: string[]
): Promise<Array<{ id: string }>> {
  const { data, error } = await supabaseAdmin
    .from("canonical_earning_state")
    .update({
      status: "available",
      payout_id: null,
      payout_request_id: null,
      paid_out_at: null,
    })
    .in("id", earningIds)
    .eq("status", "requested")
    .select("id")
    .returns<Array<{ id: string }>>()

  if (error) {
    throw error
  }

  return data ?? []
}
export async function markEarningRowAsReversed({
  earningId,
  reversedAt,
}: {
  earningId: string
  reversedAt: string
}): Promise<EarningRow> {
  const { data, error } = await supabaseAdmin
    .from("canonical_earning_state")
    .update({
      status: "reversed",
      reversed_at: reversedAt,
    })
    .eq("id", earningId)
    .select(EARNING_ROW_SELECT)
    .single<EarningRow>()

  if (error || !data) {
    throw error ?? new Error("FAILED_TO_REVERSE_EARNING")
  }

  return data
}
