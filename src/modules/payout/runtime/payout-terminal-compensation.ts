import type { PayoutTerminalRow } from "@/modules/payout/repositories/payout-read-repository"
import { compensatePayoutTerminalRowState } from "@/modules/payout/services/payout-compensation-service"
import type { ExecutePayoutTerminalTransitionTarget } from "@/modules/payout/contracts/payout-execution-contract"

export async function compensateAndShadowPayoutTerminalRowState({
  payoutId,
  targetState,
  reason,
  restoredState,
  linkedEarningIds,
}: {
  payoutId: string
  targetState: ExecutePayoutTerminalTransitionTarget
  reason: string
  restoredState: {
    status: PayoutTerminalRow["status"]
    paidAt: string | null
    failureReason: string | null
  }
  linkedEarningIds: string[]
}) {
  await compensatePayoutTerminalRowState({
    payoutId,
    status: restoredState.status,
    paidAt: restoredState.paidAt,
    failureReason: restoredState.failureReason,
  })

  void targetState
  void reason
  void linkedEarningIds

  try {
  } catch {
    // Payout compensation shadowing must never affect restore execution.
  }
}
