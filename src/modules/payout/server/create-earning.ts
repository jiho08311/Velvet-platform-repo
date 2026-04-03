import { supabaseAdmin } from "@/infrastructure/supabase/admin"

import type { Earning, EarningSourceType } from "../types"

type PaymentType = "subscription" | "tip" | "ppv_message" | "ppv_post"
type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded"

type CreateEarningInput = {
  paymentId: string
}

type PaymentRow = {
  id: string
  creator_id: string | null
  type: PaymentType
  status: PaymentStatus
  currency: string | null
  amount: number | null
  confirmed_at: string | null
}

type EarningRow = {
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
  status: "pending" | "available" | "paid_out" | "reversed"
  available_at: string | null
  paid_out_at: string | null
  reversed_at: string | null
  created_at: string
}

function getFeeRateBps(type: EarningSourceType): number {
  switch (type) {
    case "subscription":
      return 2000
    case "ppv_post":
      return 1000
    case "ppv_message":
      return 1000
  }
}

function toEarning(row: EarningRow): Earning {
  return {
    id: row.id,
    creatorId: row.creator_id,
    paymentId: row.payment_id,
    payoutId: row.payout_id,
    sourceType: row.source_type,
    grossamount: row.gross_amount,
    feeRateBps: row.fee_rate_bps,
    feeamount: row.fee_amount,
    netamount: row.net_amount,
    currency: row.currency,
    status: row.status,
    availableAt: row.available_at,
    paidOutAt: row.paid_out_at,
    reversedAt: row.reversed_at,
    createdAt: row.created_at,
  }
}

function toEarningSourceType(type: PaymentType): EarningSourceType | null {
  if (type === "subscription") {
    return "subscription"
  }

  if (type === "ppv_post") {
    return "ppv_post"
  }

  if (type === "ppv_message") {
    return "ppv_message"
  }

  if (type === "tip") {
    return "ppv_message"
  }

  return null
}

function addDays(isoString: string, days: number): string {
  const date = new Date(isoString)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

export async function createEarning({
  paymentId,
}: CreateEarningInput): Promise<Earning | null> {
  const id = paymentId.trim()

  if (!id) {
    return null
  }

  const { data: existingEarning, error: existingEarningError } =
    await supabaseAdmin
      .from("earnings")
      .select(
        "id, creator_id, payment_id, payout_id, source_type, gross_amount, fee_rate_bps, fee_amount, net_amount, currency, status, available_at, paid_out_at, reversed_at, created_at"
      )
      .eq("payment_id", id)
      .maybeSingle<EarningRow>()

  if (existingEarningError) {
    throw existingEarningError
  }

  if (existingEarning) {
    return toEarning(existingEarning)
  }

  const { data: payment, error: paymentError } = await supabaseAdmin
    .from("payments")
    .select("id, creator_id, type, status, currency, amount, confirmed_at")
    .eq("id", id)
    .maybeSingle<PaymentRow>()

  if (paymentError) {
    throw paymentError
  }

  if (!payment) {
    return null
  }

  if (!payment.creator_id) {
    throw new Error("PAYMENT_CREATOR_REQUIRED")
  }

  if (payment.status !== "succeeded") {
    throw new Error("PAYMENT_NOT_SUCCEEDED")
  }

  const sourceType = toEarningSourceType(payment.type)

  if (!sourceType) {
    return null
  }

  const grossamount = payment.amount ?? 0

  if (grossamount <= 0) {
    throw new Error("INVALID_PAYMENT_AMOUNT")
  }

  const feeRateBps = getFeeRateBps(sourceType)
  const feeamount = Math.floor((grossamount * feeRateBps) / 10000)
  const netamount = grossamount - feeamount
  const confirmedAt = payment.confirmed_at ?? new Date().toISOString()
  const availableAt = addDays(confirmedAt, 7)

  const { data, error } = await supabaseAdmin
    .from("earnings")
    .insert({
      creator_id: payment.creator_id,
      payment_id: payment.id,
      payout_id: null,
      source_type: sourceType,
      gross_amount: grossamount,
      fee_rate_bps: feeRateBps,
      fee_amount: feeamount,
      net_amount: netamount,
      currency: payment.currency ?? "KRW",
      status: "pending",
      available_at: availableAt,
      paid_out_at: null,
      reversed_at: null,
      created_at: confirmedAt,
    })
    .select(
      "id, creator_id, payment_id, payout_id, source_type, gross_amount, fee_rate_bps, fee_amount, net_amount, currency, status, available_at, paid_out_at, reversed_at, created_at"
    )
    .single<EarningRow>()

  if (error) {
    throw error
  }

  return toEarning(data)
}