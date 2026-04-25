import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { getPayoutAccountReadiness } from "./get-payout-account-readiness"
import {
  mapCreatePayoutRequestResult,
  normalizeCreatePayoutRequestInput,
  type CreatePayoutRequestInput,
  type CreatePayoutRequestResult,
} from "./payout-request-contract"
import { createAuditLog } from "@/modules/analytics/server/create-audit-log"
import {
  filterRequestableEarnings,
  resolvePayoutBalanceTotals,
  type EarningBalanceStatus,
} from "@/modules/payout/lib/payout-balance-policy"

type RequestableEarningRow = {
  id: string
  net_amount: number | null
  status: EarningBalanceStatus
  payout_request_id: string | null
  payout_id: string | null
}

type CreatedPayoutRequestRow = {
  id: string
  creator_id: string
  amount: number
  currency: string
  status: "pending" | "approved" | "rejected"
  created_at: string
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

export async function createPayoutRequest(
  input: CreatePayoutRequestInput
): Promise<CreatePayoutRequestResult> {
  const normalizedInput = normalizeCreatePayoutRequestInput(input)
  const { creatorId } = normalizedInput

  const accountReadiness = await getPayoutAccountReadiness({ creatorId })

  const { data: earnings, error: earningsError } = await supabaseAdmin
    .from("earnings")
    .select("id, net_amount, status, payout_request_id, payout_id")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: true })
    .returns<RequestableEarningRow[]>()

  if (earningsError) {
    throw earningsError
  }

  const earningsSnapshot = earnings ?? []
  const requestableEarnings = filterRequestableEarnings(earningsSnapshot)
  const balanceTotals = resolvePayoutBalanceTotals(earningsSnapshot)
  const requestableAmount = balanceTotals.requestableAmount
  const requestedAmount =
    normalizedInput.requestedAmount ?? requestableAmount

  const eligibility = resolvePayoutRequestEligibility({
    accountReadinessState: accountReadiness.state,
    requestedAmount,
    availableBalance: requestableAmount,
  })

  if (!eligibility.isEligible) {
    if (eligibility.state === "invalid_amount") {
      throw new Error("PAYOUT_REQUEST_AMOUNT_INVALID")
    }

    if (eligibility.state === "account_required") {
      throw new Error("PAYOUT_ACCOUNT_NOT_READY")
    }

    if (eligibility.state === "insufficient_balance") {
      throw new Error("INSUFFICIENT_AVAILABLE_BALANCE")
    }

    throw new Error("PAYOUT_REQUEST_NOT_ELIGIBLE")
  }

  if (
    normalizedInput.requestedAmount !== null &&
    normalizedInput.requestedAmount !== requestableAmount
  ) {
    throw new Error("PAYOUT_REQUEST_AMOUNT_MUST_MATCH_AVAILABLE_BALANCE")
  }

  const selectedEarningIds = requestableEarnings.map((earning) => earning.id)

  if (selectedEarningIds.length === 0) {
    throw new Error("NOT_ENOUGH_EARNINGS")
  }

  const { data: payoutRequest, error: payoutError } = await supabaseAdmin
    .from("payout_requests")
    .insert({
      creator_id: creatorId,
      amount: requestableAmount,
      currency: normalizedInput.currency,
      status: "pending",
    })
    .select("id, creator_id, amount, currency, status, created_at")
    .single()
    .returns<CreatedPayoutRequestRow>()

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

  await createAuditLog({
    actorId: creatorId,
    action: "payout_requested",
    targetType: "payout_request",
    targetId: payoutRequest.id,
    metadata: {
      amount: payoutRequest.amount,
      currency: payoutRequest.currency,
    },
  })

  return mapCreatePayoutRequestResult(payoutRequest)
}
