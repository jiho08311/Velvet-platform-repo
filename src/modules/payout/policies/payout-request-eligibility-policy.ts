type PayoutRequestEligibilityState =
  | "eligible"
  | "invalid_amount"
  | "account_required"
  | "insufficient_balance"

export function resolvePayoutRequestEligibility({
  accountReadinessState,
  requestedAmount,
  availableBalance,
}: {
  accountReadinessState: "ready" | "missing"
  requestedAmount: number
  availableBalance: number
}): {
  state: PayoutRequestEligibilityState
  isEligible: boolean
} {
  if (requestedAmount <= 0) {
    return {
      state: "invalid_amount",
      isEligible: false,
    }
  }

  if (accountReadinessState !== "ready") {
    return {
      state: "account_required",
      isEligible: false,
    }
  }

  if (availableBalance < requestedAmount) {
    return {
      state: "insufficient_balance",
      isEligible: false,
    }
  }

  return {
    state: "eligible",
    isEligible: true,
  }
}

export function assertPayoutRequestEligibility(input: {
  accountReadinessState: "ready" | "missing"
  requestedAmount: number
  availableBalance: number
}): void {
  const eligibility = resolvePayoutRequestEligibility(input)

  if (eligibility.isEligible) {
    return
  }

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