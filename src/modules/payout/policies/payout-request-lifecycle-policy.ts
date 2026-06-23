import { resolvePayoutRequestLifecycleState } from "@/modules/payout/policies/resolve-payout-state"

export function assertApprovablePayoutRequest(input: {
  payoutRequestStatus: string | null
}): void {
  const lifecycle = resolvePayoutRequestLifecycleState({
    payoutRequestStatus: input.payoutRequestStatus,
  })

  if (lifecycle.state !== "pending_request") {
    throw new Error("PAYOUT_REQUEST_NOT_APPROVABLE")
  }
}

export function assertRejectablePayoutRequest(input: {
  payoutRequestStatus: string | null
}): void {
  const lifecycle = resolvePayoutRequestLifecycleState({
    payoutRequestStatus: input.payoutRequestStatus,
  })

  if (lifecycle.state !== "pending_request") {
    throw new Error("PAYOUT_REQUEST_NOT_REJECTABLE")
  }
}