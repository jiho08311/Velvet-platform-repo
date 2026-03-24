import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

import { getCreatorBalance } from "./get-creator-balance"

type CreatePayoutRequestInput = {
  creatorId: string
  amount: number
  currency?: string
}

export async function createPayoutRequest(
  input: CreatePayoutRequestInput
) {
  const supabase = await createSupabaseServerClient()

  const creatorId = input.creatorId.trim()

  if (!creatorId) {
    throw new Error("Creator id is required")
  }

  if (input.amount <= 0) {
    throw new Error("Amount must be greater than 0")
  }

  const balance = await getCreatorBalance({ creatorId })

  if (input.amount > balance.availableBalanceCents) {
    throw new Error("INSUFFICIENT_AVAILABLE_BALANCE")
  }

  const currency = input.currency?.trim().toUpperCase() || "KRW"

  const { data, error } = await supabase
    .from("payout_requests")
    .insert({
      creator_id: creatorId,
      amount_cents: input.amount,
      currency,
      status: "pending",
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}