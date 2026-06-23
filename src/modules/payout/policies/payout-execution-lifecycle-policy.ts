import type { PayoutTerminalRow } from "@/modules/payout/repositories/payout-read-repository"

export function resolvePayoutExecutionLifecyclePolicy(
  payout: Pick<PayoutTerminalRow, "status">
) {
  return {
    canSend: payout.status === "pending" || payout.status === "processing",
    canMarkAsFailed:
      payout.status === "pending" || payout.status === "processing",
  }
}

export function assertPayoutSendable(
  payout: Pick<PayoutTerminalRow, "status">
): void {
  const policy = resolvePayoutExecutionLifecyclePolicy(payout)

  if (!policy.canSend) {
    throw new Error("PAYOUT_NOT_SENDABLE")
  }
}

export function assertPayoutFailable(
  payout: Pick<PayoutTerminalRow, "status">
): void {
  const policy = resolvePayoutExecutionLifecyclePolicy(payout)

  if (!policy.canMarkAsFailed) {
    throw new Error("PAYOUT_NOT_FAILABLE")
  }
}