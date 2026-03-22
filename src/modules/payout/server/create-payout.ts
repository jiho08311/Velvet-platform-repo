import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type CreatePayoutParams = {
  creatorId: string
  amountCents: number
  currency: string
}

type CreatorRow = {
  id: string
}

type PayoutRow = {
  id: string
  creator_id: string
  amount_cents: number
  currency: string
  status: string
  provider_payout_id: string | null
  created_at: string
}

export type CreatedPayout = {
  id: string
  creatorId: string
  amountCents: number
  currency: string
  status: string
  providerPayoutId: string | null
  createdAt: string
}

export async function createPayout({
  creatorId,
  amountCents,
  currency,
}: CreatePayoutParams): Promise<CreatedPayout> {
  const supabase = await createSupabaseServerClient()

  const { data: creator, error: creatorError } = await supabase
    .from("creators")
    .select("id")
    .eq("id", creatorId)
    .maybeSingle<CreatorRow>()

  if (creatorError) {
    throw creatorError
  }

  if (!creator) {
    throw new Error("Creator not found")
  }

  const createdAt = new Date().toISOString()

  const { data, error } = await supabase
    .from("payouts")
    .insert({
      creator_id: creatorId,
      amount_cents: amountCents,
      currency,
      status: "completed",
      provider_payout_id: null,
      created_at: createdAt,
    })
    .select(
      "id, creator_id, amount_cents, currency, status, provider_payout_id, created_at"
    )
    .single<PayoutRow>()

  if (error) {
    throw error
  }

  return {
    id: data.id,
    creatorId: data.creator_id,
    amountCents: data.amount_cents,
    currency: data.currency,
    status: data.status,
    providerPayoutId: data.provider_payout_id,
    createdAt: data.created_at,
  }
}