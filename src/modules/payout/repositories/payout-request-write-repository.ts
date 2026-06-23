import { supabaseAdmin } from "@/infrastructure/supabase/admin"


export type CreatedPayoutRequestRow = {
  id: string
  creator_id: string
  amount: number
  currency: string
  status: "pending" | "approved" | "rejected"
  created_at: string
}

export type InsertPayoutRequestRowInput = {
  creatorId: string
  amount: number
  currency: string
}

export async function insertPayoutRequestRow({
  creatorId,
  amount,
  currency,
}: InsertPayoutRequestRowInput): Promise<CreatedPayoutRequestRow> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payout_request_state")
    .insert({
      creator_id: creatorId,
      amount,
      currency,
      status: "pending",
    })
    .select("id, creator_id, amount, currency, status, created_at")
    .single()
    .returns<CreatedPayoutRequestRow>()

  if (error || !data) {
    throw error ?? new Error("FAILED_TO_CREATE_PAYOUT_REQUEST")
  }

  return data
}

export async function deletePayoutRequestRow(
  payoutRequestId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("canonical_payout_request_state")
    .delete()
    .eq("id", payoutRequestId)

  if (error) {
    throw error
  }
}

export type PayoutRequestLifecycleRow = {
  id: string
  status: string
  approved_at: string | null
  rejected_at: string | null
}

export type ApprovePayoutRequestResultRow = {
  payout_request_id: string
  payout_id: string
  creator_id: string
  amount: number
  currency: string
  status: string
}

export async function findPayoutRequestLifecycleRowOrThrow(
  payoutRequestId: string
): Promise<PayoutRequestLifecycleRow> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payout_request_state")
    .select("id, status, approved_at, rejected_at")
    .eq("id", payoutRequestId)
    .single<PayoutRequestLifecycleRow>()

  if (error || !data) {
    throw new Error("PAYOUT_REQUEST_NOT_FOUND")
  }

  return data
}

export async function executeApprovePayoutRequestRpc(
  payoutRequestId: string
): Promise<ApprovePayoutRequestResultRow[]> {
  const { data, error } = await supabaseAdmin.rpc(
    "approve_payout_request_and_create_payout",
    {
      p_payout_request_id: payoutRequestId,
    }
  )
  

  if (error) {
    throw error
  }

  return (data ?? []) as ApprovePayoutRequestResultRow[]
}

export async function markPayoutRequestRowAsRejected({
  payoutRequestId,
  rejectedAt,
}: {
  payoutRequestId: string
  rejectedAt: string
}): Promise<PayoutRequestLifecycleRow> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payout_request_state")
    .update({
      status: "rejected",
      rejected_at: rejectedAt,
    })
    .eq("id", payoutRequestId)
    .eq("status", "pending")
    .select("id, status, approved_at, rejected_at")
    .single<PayoutRequestLifecycleRow>()

  if (error || !data) {
    throw error ?? new Error("FAILED_TO_REJECT_PAYOUT_REQUEST")
  }

  return data
}

export async function restorePayoutRequestRejectionState({
  payoutRequestId,
  status,
  rejectedAt,
}: {
  payoutRequestId: string
  status: string
  rejectedAt: string | null
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("canonical_payout_request_state")
    .update({
      status,
      rejected_at: rejectedAt,
    })
    .eq("id", payoutRequestId)

  if (error) {
    throw error
  }
}
