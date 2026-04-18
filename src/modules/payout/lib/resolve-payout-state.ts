type NullableString = string | null | undefined

export const FAILED_PAYOUT_POLICY = "terminal" as const

export type PayoutAccountReadinessState = "missing" | "incomplete" | "ready"

export type ResolvedPayoutAccountReadiness = {
  state: PayoutAccountReadinessState
  isReady: boolean
}

type ResolvePayoutAccountReadinessInput = {
  bankName?: NullableString
  accountHolderName?: NullableString
  accountNumber?: NullableString
}

function hasText(value?: NullableString): boolean {
  return typeof value === "string" && value.trim().length > 0
}

export function resolvePayoutAccountReadiness(
  input: ResolvePayoutAccountReadinessInput | null | undefined
): ResolvedPayoutAccountReadiness {
  if (!input) {
    return {
      state: "missing",
      isReady: false,
    }
  }

  const hasBankName = hasText(input.bankName)
  const hasAccountHolderName = hasText(input.accountHolderName)
  const hasAccountNumber = hasText(input.accountNumber)

  if (hasBankName && hasAccountHolderName && hasAccountNumber) {
    return {
      state: "ready",
      isReady: true,
    }
  }

  if (!hasBankName && !hasAccountHolderName && !hasAccountNumber) {
    return {
      state: "missing",
      isReady: false,
    }
  }

  return {
    state: "incomplete",
    isReady: false,
  }
}

export type PayoutRequestEligibilityState =
  | "eligible"
  | "account_required"
  | "insufficient_balance"
  | "invalid_amount"

export type ResolvedPayoutRequestEligibility = {
  state: PayoutRequestEligibilityState
  isEligible: boolean
}

type ResolvePayoutRequestEligibilityInput = {
  accountReadinessState: PayoutAccountReadinessState
  requestedAmount: number
  availableBalance: number
}

export function resolvePayoutRequestEligibility(
  input: ResolvePayoutRequestEligibilityInput
): ResolvedPayoutRequestEligibility {
  if (!Number.isFinite(input.requestedAmount) || input.requestedAmount <= 0) {
    return {
      state: "invalid_amount",
      isEligible: false,
    }
  }

  if (input.accountReadinessState !== "ready") {
    return {
      state: "account_required",
      isEligible: false,
    }
  }

  if (
    !Number.isFinite(input.availableBalance) ||
    input.availableBalance < input.requestedAmount
  ) {
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

export type PayoutRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | string

export type PayoutStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | string

export type PayoutRequestLifecycleState =
  | "pending_request"
  | "approved"
  | "rejected"
  | "inactive"

export type ResolvedPayoutRequestLifecycleState = {
  state: PayoutRequestLifecycleState
  isTerminal: boolean
}

export function resolvePayoutRequestLifecycleState(input: {
  payoutRequestStatus?: PayoutRequestStatus | null
}): ResolvedPayoutRequestLifecycleState {
  const payoutRequestStatus = input.payoutRequestStatus ?? null

  if (payoutRequestStatus === "rejected") {
    return {
      state: "rejected",
      isTerminal: true,
    }
  }

  if (payoutRequestStatus === "approved") {
    return {
      state: "approved",
      isTerminal: false,
    }
  }

  if (payoutRequestStatus === "pending") {
    return {
      state: "pending_request",
      isTerminal: false,
    }
  }

  return {
    state: "inactive",
    isTerminal: false,
  }
}

export type PayoutExecutionLifecycleState = "processing" | "paid" | "failed"

export type ResolvedPayoutExecutionLifecycleState = {
  state: PayoutExecutionLifecycleState
  isTerminal: boolean
}

export function resolvePayoutExecutionLifecycle(input: {
  payoutStatus?: PayoutStatus | null
}): ResolvedPayoutExecutionLifecycleState {
  const payoutStatus = input.payoutStatus ?? null

  if (payoutStatus === "paid") {
    return {
      state: "paid",
      isTerminal: true,
    }
  }

  if (payoutStatus === "failed") {
    return {
      state: "failed",
      isTerminal: true,
    }
  }

  return {
    state: "processing",
    isTerminal: false,
  }
}

export function resolvePayoutExecutionLifecycleState(input: {
  payoutStatus?: PayoutStatus | null
}): PayoutExecutionLifecycleState {
  return resolvePayoutExecutionLifecycle(input).state
}

export function isPayoutExecutionTerminal(
  state: PayoutExecutionLifecycleState | null | undefined
): boolean {
  return state === "paid" || state === "failed"
}