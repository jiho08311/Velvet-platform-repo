import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type RefundEventRow = {
  id: string
  payment_id: string
  creator_id: string | null
  amount: number
  currency: string
  provider_reference: string | null
  reason: string | null
  occurred_at: string
  created_at: string
}

export type ChargebackEventRow = {
  id: string
  payment_id: string
  creator_id: string | null
  amount: number
  currency: string
  provider_reference: string | null
  reason: string | null
  occurred_at: string
  created_at: string
}

export type LedgerAdjustmentRow = {
  id: string
  original_transaction_id: string
  adjustment_transaction_id: string
  adjustment_type: "refund" | "chargeback" | "manual"
  refund_event_id: string | null
  chargeback_event_id: string | null
  reason: string | null
  created_at: string
}

export async function insertRefundEvent({
  paymentId,
  creatorId,
  amount,
  currency,
  providerReference,
  reason,
  occurredAt,
}: {
  paymentId: string
  creatorId: string | null
  amount: number
  currency: string
  providerReference?: string | null
  reason?: string | null
  occurredAt: string
}): Promise<RefundEventRow> {
  const { data, error } = await supabaseAdmin
    .from("refund_events")
    .insert({
      payment_id: paymentId,
      creator_id: creatorId,
      amount,
      currency,
      provider_reference: providerReference ?? null,
      reason: reason ?? null,
      occurred_at: occurredAt,
    })
    .select(
      "id, payment_id, creator_id, amount, currency, provider_reference, reason, occurred_at, created_at"
    )
    .single<RefundEventRow>()

  if (error || !data) {
    throw error ?? new Error("FAILED_TO_INSERT_REFUND_EVENT")
  }

  return data
}

export async function insertChargebackEvent({
  paymentId,
  creatorId,
  amount,
  currency,
  providerReference,
  reason,
  occurredAt,
}: {
  paymentId: string
  creatorId: string | null
  amount: number
  currency: string
  providerReference?: string | null
  reason?: string | null
  occurredAt: string
}): Promise<ChargebackEventRow> {
  const { data, error } = await supabaseAdmin
    .from("chargeback_events")
    .insert({
      payment_id: paymentId,
      creator_id: creatorId,
      amount,
      currency,
      provider_reference: providerReference ?? null,
      reason: reason ?? null,
      occurred_at: occurredAt,
    })
    .select(
      "id, payment_id, creator_id, amount, currency, provider_reference, reason, occurred_at, created_at"
    )
    .single<ChargebackEventRow>()

  if (error || !data) {
    throw error ?? new Error("FAILED_TO_INSERT_CHARGEBACK_EVENT")
  }

  return data
}



export async function insertLedgerAdjustment({
  originalTransactionId,
  adjustmentTransactionId,
  adjustmentType,
  refundEventId,
  chargebackEventId,
  reason,
}: {
  originalTransactionId: string
  adjustmentTransactionId: string
  adjustmentType: "refund" | "chargeback" | "manual"
  refundEventId?: string | null
  chargebackEventId?: string | null
  reason?: string | null
}): Promise<LedgerAdjustmentRow> {
  const { data, error } = await supabaseAdmin
    .from("ledger_adjustments")
    .insert({
      original_transaction_id: originalTransactionId,
      adjustment_transaction_id: adjustmentTransactionId,
      adjustment_type: adjustmentType,
      refund_event_id: refundEventId ?? null,
      chargeback_event_id: chargebackEventId ?? null,
      reason: reason ?? null,
    })
    .select(
      "id, original_transaction_id, adjustment_transaction_id, adjustment_type, refund_event_id, chargeback_event_id, reason, created_at"
    )
    .single<LedgerAdjustmentRow>()

  if (error || !data) {
    throw error ?? new Error("FAILED_TO_INSERT_LEDGER_ADJUSTMENT")
  }

  return data
}

export async function findPaymentConfirmedLedgerTransactionByPaymentId(
  paymentId: string
): Promise<{ id: string } | null> {
  const { data, error } = await supabaseAdmin
    .from("ledger_transactions")
    .select("id")
    .eq("transaction_type", "payment_confirmed")
    .eq("payment_id", paymentId)
    .maybeSingle<{ id: string }>()

  if (error) {
    throw error
  }

  return data ?? null
}