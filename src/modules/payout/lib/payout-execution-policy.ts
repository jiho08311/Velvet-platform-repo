import { isPayoutExecutionTerminal } from "./resolve-payout-state"

type PayoutStatus = "pending" | "processing" | "paid" | "failed" | string

type PayoutLike = {
  status: PayoutStatus
}

export type PayoutExecutionPolicy = {
  canSend: boolean
  canMarkAsFailed: boolean
  isTerminal: boolean
}

export function resolvePayoutExecutionPolicy(
  payout: PayoutLike
): PayoutExecutionPolicy {
  const status = payout.status

const isTerminal = isPayoutExecutionTerminal(status as any)

  // 현재 로직 그대로 반영 (절대 수정 X)
  const isPendingOrProcessing =
    status === "pending" || status === "processing"

  const canSend =
    status === "paid"
      ? true // send는 현재 idempotent return 허용
      : !isTerminal && isPendingOrProcessing

  const canMarkAsFailed =
    status !== "paid" &&
    !isTerminal &&
    isPendingOrProcessing

  return {
    canSend,
    canMarkAsFailed,
    isTerminal,
  }
}