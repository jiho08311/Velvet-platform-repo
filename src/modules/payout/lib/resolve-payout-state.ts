export type PayoutExecutionLifecycleState = "processing" | "paid" | "failed"

export type ResolvedPayoutExecutionLifecycleState = {
  state: PayoutExecutionLifecycleState
  isTerminal: boolean
}
export type PayoutStatus = "pending" | "processing" | "paid" | "failed"

export type PayoutRequestLifecycleState =
  | "pending_request"
  | "approved"
  | "rejected"
  | "inactive"
/**
 * Canonical execution projection source of truth.
 *
 * Read-side rule:
 * - payout execution meaning must be derived from payout.status only
 * - creator-facing payout surfaces and admin execution badges must use this
 *
 * Projection policy:
 * - paid -> paid
 * - failed -> failed
 * - pending / processing -> processing
 * - null / unknown -> processing
 *
 * This function intentionally collapses non-terminal execution states into the
 * single canonical execution lifecycle state: "processing".
 */
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

  if (payoutStatus === "pending" || payoutStatus === "processing") {
    return {
      state: "processing",
      isTerminal: false,
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

export function resolvePayoutRequestLifecycleState(input: {
  payoutRequestStatus?: string | null
}): {
  state: PayoutRequestLifecycleState
  isTerminal: boolean
} {
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
      isTerminal: true,
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
    isTerminal: true,
  }
}