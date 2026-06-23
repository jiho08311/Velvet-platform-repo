import type { AuditCorrelationContext } from "@/shared/observability/audit-event-types"
import {
  executePayoutTerminalExecution,
  type ExecutePayoutTerminalTransitionTarget,
} from "@/modules/payout/services/payout-execution-service"

/**
 * Canonical terminal execution entrypoint for payout paid/failed transitions.
 *
 * This server entrypoint intentionally stays as the public server-side
 * compatibility boundary while terminal orchestration is delegated to the
 * payout execution service.
 */
type ExecutePayoutTerminalTransitionParams = {
  payoutId: string
  targetState: ExecutePayoutTerminalTransitionTarget
  failureReason?: string
  correlation?: AuditCorrelationContext
}

function normalizePayoutId(payoutId: string): string {
  const safePayoutId = payoutId.trim()

  if (!safePayoutId) {
    throw new Error("Invalid payout id")
  }

  return safePayoutId
}

export async function executePayoutTerminalTransition({
  payoutId,
  targetState,
  failureReason,
  correlation,
}: ExecutePayoutTerminalTransitionParams) {
  const safePayoutId = normalizePayoutId(payoutId)

  return executePayoutTerminalExecution({
    payoutId: safePayoutId,
    targetState,
    failureReason,
    correlation,
  })
}