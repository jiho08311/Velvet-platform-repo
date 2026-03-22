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
  console.log("CREATE PAYOUT START", {
    payment,
  })

  const platformFee = Math.floor(payment.amount_cents * 0.2)
  const creatorAmount = payment.amount_cents - platformFee

  console.log("CREATE PAYOUT CALCULATED", {
    platformFee,
    creatorAmount,
  })

  const { data, error } = await supabaseAdmin
    .from("payouts")
    .insert({
      creator_id: payment.creator_id,
      payment_id: payment.id,
      amount_cents: creatorAmount,
      currency: payment.currency,
      status: "pending",
    })
    .select("id, creator_id, payment_id, amount_cents, currency, status")
    .single()

  console.log("CREATE PAYOUT INSERT RESULT", {
    data,
    error,
  })

  if (error) {
    throw error
  }

  return data
}