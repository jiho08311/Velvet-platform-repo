import type { AuditCorrelationContext } from "@/shared/observability/audit-event-types"
import {
  findPayoutTerminalRowOrThrow,
} from "@/modules/payout/repositories/payout-read-repository"
import {
  listLinkedRequestedEarningRowsByPayoutId,
} from "@/modules/payout/repositories/earning-read-repository"
import {
  assertPayoutFailable,
  assertPayoutSendable,
} from "@/modules/payout/policies/payout-execution-lifecycle-policy"
import type {
  ExecutePayoutTerminalTransitionTarget,
  PayoutExecutionResult,
} from "@/modules/payout/contracts/payout-execution-contract"
import { executePayoutTerminalFailed } from "./execute-payout-terminal-failed"
import { executePayoutTerminalPaid } from "./execute-payout-terminal-paid"

export type ExecutePayoutTerminalExecutionParams = {
  payoutId: string
  targetState: ExecutePayoutTerminalTransitionTarget
  failureReason?: string
  correlation?: AuditCorrelationContext
}

export async function executePayoutTerminal({
  payoutId,
  targetState,
  failureReason,
  correlation,
}: ExecutePayoutTerminalExecutionParams): Promise<PayoutExecutionResult> {
  const payout = await findPayoutTerminalRowOrThrow(payoutId)

  if (targetState === "paid") {
    assertPayoutSendable(payout)
  }

  if (targetState === "failed") {
    assertPayoutFailable(payout)
  }

  const linkedRequestedEarnings =
    await listLinkedRequestedEarningRowsByPayoutId(payoutId)
  const linkedRequestedEarningIds = linkedRequestedEarnings.map((row) => row.id)
  const now = new Date().toISOString()

  if (targetState === "paid") {
    return executePayoutTerminalPaid({
      payoutId,
      payout,
      linkedRequestedEarningIds,
      now,
      correlation,
    })
  }

  return executePayoutTerminalFailed({
    payoutId,
    payout,
    linkedRequestedEarningIds,
    now,
    failureReason,
    correlation,
  })
}
