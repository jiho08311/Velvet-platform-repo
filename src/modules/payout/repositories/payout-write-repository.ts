import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { PayoutTerminalRow } from "@/modules/payout/repositories/payout-read-repository"

export async function markPayoutRowAsPaid({
  payoutId,
  paidAt,
}: {
  payoutId: string
  paidAt: string
}): Promise<PayoutTerminalRow> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payout_state")
    .update({
      status: "paid",
      paid_at: paidAt,
      failure_reason: null,
    })
    .eq("id", payoutId)
    .select("id, status, paid_at, failure_reason")
    .single<PayoutTerminalRow>()

  if (error || !data) {
    throw error ?? new Error("FAILED_TO_MARK_PAYOUT_AS_PAID")
  }

  return data
}

export async function markPayoutRowAsFailed({
  payoutId,
  failureReason,
}: {
  payoutId: string
  failureReason: string
}): Promise<PayoutTerminalRow> {
  const { data, error } = await supabaseAdmin
    .from("canonical_payout_state")
    .update({
      status: "failed",
      failure_reason: failureReason,
      paid_at: null,
    })
    .eq("id", payoutId)
    .select("id, status, paid_at, failure_reason")
    .single<PayoutTerminalRow>()

  if (error || !data) {
    throw error ?? new Error("FAILED_TO_MARK_PAYOUT_AS_FAILED")
  }

  return data
}

export async function restorePayoutTerminalRowState({
  payoutId,
  status,
  paidAt,
  failureReason,
}: {
  payoutId: string
  status: PayoutTerminalRow["status"]
  paidAt: string | null
  failureReason: string | null
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("canonical_payout_state")
    .update({
      status,
      paid_at: paidAt,
      failure_reason: failureReason,
    })
    .eq("id", payoutId)

  if (error) {
    throw error
  }
}