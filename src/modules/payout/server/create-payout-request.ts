import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { getCreatorBalance } from "./get-creator-balance"
import { getPayoutAccountReadiness } from "./get-payout-account-readiness"
import { resolvePayoutRequestEligibility } from "@/modules/payout/lib/resolve-payout-state"

type CreatePayoutRequestInput = {
  creatorId: string
  amount: number
  currency?: string
}

type AvailableEarningRow = {
  id: string
  net_amount: number
}

export async function createPayoutRequest(
  input: CreatePayoutRequestInput
) {
  const creatorId = input.creatorId.trim()

  if (!creatorId) {
    throw new Error("Creator id is required")
  }

  const balance = await getCreatorBalance({ creatorId })
  const accountReadiness = await getPayoutAccountReadiness({ creatorId })

  const eligibility = resolvePayoutRequestEligibility({
    accountReadinessState: accountReadiness.state,
    requestedAmount: input.amount,
    availableBalance: balance.availableBalance,
  })

  if (!eligibility.isEligible) {
    if (eligibility.state === "invalid_amount") {
      throw new Error("Amount must be greater than 0")
    }

    if (eligibility.state === "account_required") {
      throw new Error("PAYOUT_ACCOUNT_NOT_READY")
    }

    if (eligibility.state === "insufficient_balance") {
      throw new Error("INSUFFICIENT_AVAILABLE_BALANCE")
    }

    throw new Error("PAYOUT_REQUEST_NOT_ELIGIBLE")
  }

  const currency = input.currency?.trim().toUpperCase() || "KRW"

  const { data: earnings, error: earningsError } = await supabaseAdmin
    .from("earnings")
    .select("id, net_amount")
    .eq("creator_id", creatorId)
    .eq("status", "available")
    .is("payout_request_id", null)
    .is("payout_id", null)
    .order("created_at", { ascending: true })
    .returns<AvailableEarningRow[]>()

  if (earningsError) {
    throw earningsError
  }

  let remaining = input.amount
  const selectedEarningIds: string[] = []

  for (const earning of earnings ?? []) {
    if (remaining <= 0) break

    if (earning.net_amount > remaining && selectedEarningIds.length > 0) {
      break
    }

    selectedEarningIds.push(earning.id)
    remaining -= earning.net_amount
  }

  if (remaining > 0 || selectedEarningIds.length === 0) {
    throw new Error("NOT_ENOUGH_EARNINGS")
  }

  const { data: payoutRequest, error: payoutError } = await supabaseAdmin
    .from("payout_requests")
    .insert({
      creator_id: creatorId,
      amount: input.amount,
      currency,
      status: "pending",
    })
    .select()
    .single()

  if (payoutError || !payoutRequest) {
    throw payoutError ?? new Error("FAILED_TO_CREATE_PAYOUT_REQUEST")
  }

  const { data: updatedEarnings, error: updateError } = await supabaseAdmin
    .from("earnings")
    .update({
      status: "requested",
      payout_request_id: payoutRequest.id,
    })
    .in("id", selectedEarningIds)
    .eq("creator_id", creatorId)
    .is("payout_id", null)
    .is("payout_request_id", null)
    .eq("status", "available")
    .select("id")

  if (updateError) {
    await supabaseAdmin
      .from("payout_requests")
      .delete()
      .eq("id", payoutRequest.id)

    throw updateError
  }

  if (!updatedEarnings || updatedEarnings.length !== selectedEarningIds.length) {
    await supabaseAdmin
      .from("payout_requests")
      .delete()
      .eq("id", payoutRequest.id)

    throw new Error("FAILED_TO_LOCK_EARNINGS_FOR_PAYOUT_REQUEST")
  }

  return payoutRequest
}