import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { getPayoutAccountReadiness } from "./get-payout-account-readiness"

import {
  isRequestableEarning,
  sumRequestableEarnings,
} from "@/modules/payout/lib/payout-balance-policy"

type CreatePayoutRequestInput = { 
  creatorId: string
  amount?: number
  currency?: string
}

type RequestableEarningRow = {
  id: string
  net_amount: number | null
  status: "pending" | "available" | "requested" | "paid_out" | "reversed"
  payout_request_id: string | null
  payout_id: string | null
}

function resolvePayoutRequestEligibility(input: {
  accountReadinessState: string
  requestedAmount: number
  availableBalance: number
}) {
  if (input.requestedAmount <= 0) {
    return {
      isEligible: false,
      state: "invalid_amount" as const,
    }
  }

  if (input.accountReadinessState !== "ready") {
    return {
      isEligible: false,
      state: "account_required" as const,
    }
  }

  if (input.requestedAmount > input.availableBalance) {
    return {
      isEligible: false,
      state: "insufficient_balance" as const,
    }
  }

  return {
    isEligible: true,
    state: "eligible" as const,
  }
}

export async function createPayoutRequest(input: CreatePayoutRequestInput) {
  const creatorId = input.creatorId.trim()

  if (!creatorId) {
    throw new Error("Creator id is required")
  }

  const accountReadiness = await getPayoutAccountReadiness({ creatorId })

  const { data: earnings, error: earningsError } = await supabaseAdmin
    .from("earnings")
    .select("id, net_amount, status, payout_request_id, payout_id")
    .eq("creator_id", creatorId)
    .eq("status", "available")
    .is("payout_request_id", null)
    .is("payout_id", null)
    .order("created_at", { ascending: true })
    .returns<RequestableEarningRow[]>()

  if (earningsError) {
    throw earningsError
  }

  const requestableEarnings = (earnings ?? []).filter((earning) => {
    if (!isRequestableEarning(earning)) {
      return false
    }

    return (earning.net_amount ?? 0) > 0
  })

  const requestableAmount = sumRequestableEarnings(requestableEarnings)

  const eligibility = resolvePayoutRequestEligibility({
    accountReadinessState: accountReadiness.state,
    requestedAmount: requestableAmount,
    availableBalance: requestableAmount,
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

  const selectedEarningIds = requestableEarnings.map((earning) => earning.id)

  if (selectedEarningIds.length === 0) {
    throw new Error("NOT_ENOUGH_EARNINGS")
  }

  const currency = input.currency?.trim().toUpperCase() || "KRW"

  const { data: payoutRequest, error: payoutError } = await supabaseAdmin
    .from("payout_requests")
    .insert({
      creator_id: creatorId,
      amount: requestableAmount,
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