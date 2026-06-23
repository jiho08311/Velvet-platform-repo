export type ExecutePayoutTerminalTransitionTarget = "paid" | "failed"

export type PayoutExecutionResult = {
  payoutId: string
  targetState: ExecutePayoutTerminalTransitionTarget
  linkedEarningIds: string[]
}
