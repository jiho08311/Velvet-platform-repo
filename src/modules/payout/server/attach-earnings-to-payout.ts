import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type AttachEarningsToPayoutInput = {
  payoutId: string
  creatorId: string
  amountCents: number
}

type EarningRow = {
  id: string
  net_amount_cents: number | null
  payout_id: string | null
  status: "pending" | "available" | "paid_out" | "reversed"
}

export type AttachedEarningsToPayout = {
  payoutId: string
  creatorId: string
  requestedAmountCents: number
  attachedAmountCents: number
  earningIds: string[]
}

export async function attachEarningsToPayout({
  payoutId,
  creatorId,
  amountCents,
}: AttachEarningsToPayoutInput): Promise<AttachedEarningsToPayout> {
  const safePayoutId = payoutId.trim()
  const safeCreatorId = creatorId.trim()

  if (!safePayoutId) {
    throw new Error("Invalid payout id")
  }

  if (!safeCreatorId) {
    throw new Error("Invalid creator id")
  }

  if (amountCents <= 0) {
    throw new Error("Amount must be greater than 0")
  }

  const { data: earnings, error: earningsError } = await supabaseAdmin
    .from("earnings")
    .select("id, net_amount_cents, payout_id, status")
    .eq("creator_id", safeCreatorId)
    .eq("status", "available")
    .is("payout_id", null)
    .order("created_at", { ascending: true })
    .returns<EarningRow[]>()

  if (earningsError) {
    throw earningsError
  }

  const availableEarnings = earnings ?? []

  let attachedAmountCents = 0
  const earningIds: string[] = []

  for (const earning of availableEarnings) {
    const amount = earning.net_amount_cents ?? 0

    if (amount <= 0) {
      continue
    }

    if (attachedAmountCents + amount > amountCents) {
      continue
    }

    attachedAmountCents += amount
    earningIds.push(earning.id)

    if (attachedAmountCents === amountCents) {
      break
    }
  }

  if (attachedAmountCents !== amountCents) {
    throw new Error("INSUFFICIENT_AVAILABLE_EARNINGS")
  }

  const { error: updateError } = await supabaseAdmin
    .from("earnings")
    .update({
      payout_id: safePayoutId,
    })
    .in("id", earningIds)
    .eq("creator_id", safeCreatorId)
    .eq("status", "available")

  if (updateError) {
    throw updateError
  }

  return {
    payoutId: safePayoutId,
    creatorId: safeCreatorId,
    requestedAmountCents: amountCents,
    attachedAmountCents,
    earningIds,
  }
}