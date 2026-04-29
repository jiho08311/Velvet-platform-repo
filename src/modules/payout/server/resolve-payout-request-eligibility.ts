export type PayoutRequestEligibilityState =
  | "eligible"
  | "invalid_amount"
  | "account_required"
  | "insufficient_balance"

export type PayoutRequestEligibility = {
  isEligible: boolean
  state: PayoutRequestEligibilityState
}

type ResolvePayoutRequestEligibilityInput = {
  accountReadinessState: string
  requestedAmount: number
  availableBalance: number
}

export function resolvePayoutRequestEligibility({
  accountReadinessState,
  requestedAmount,
  availableBalance,
}: ResolvePayoutRequestEligibilityInput): PayoutRequestEligibility {
  if (requestedAmount <= 0) {
    return {
      isEligible: false,
      state: "invalid_amount",
    }
  }

  if (accountReadinessState !== "ready") {
    return {
      isEligible: false,
      state: "account_required",
    }
  }

  if (requestedAmount > availableBalance) {
    return {
      isEligible: false,
      state: "insufficient_balance",
    }
  }

  return {
    isEligible: true,
    state: "eligible",
  }
}