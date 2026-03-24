import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type CreatePayoutFromPaymentParams = {
  id: string
  creator_id: string
  amount_cents: number
  currency: string
}

export async function createPayoutFromPayment(
  payment: CreatePayoutFromPaymentParams
) {
  const platformFee = Math.floor(payment.amount_cents * 0.2)
  const creatorAmount = payment.amount_cents - platformFee

  const { data, error } = await supabaseAdmin
    .from("payouts")
    .insert({
      creator_id: payment.creator_id,
      amount_cents: creatorAmount,
      currency: payment.currency,
      status: "paid",
      provider: "mock",
      provider_payout_id: null,
      created_at: new Date().toISOString(),
      paid_at: new Date().toISOString(),
    })
    .select(
      "id, creator_id, amount_cents, currency, status, paid_at, created_at"
    )
    .single()

  if (error) {
    throw error
  }

  return data
}