import type { AuditCorrelationContext } from "@/shared/observability/audit-event-types"
import { executePayoutTerminalTransition } from "./execute-payout-terminal-transition"

/**
 * Canonical public paid-entry for payout execution.
 *
 * This file is intentionally thin:
 * - accepts payout intent = paid
 * - delegates all terminal execution business logic to executePayoutTerminalTransition
 *
 * It must never own:
 * - payout status validation policy
 * - linked earnings paid_out mutation logic
 * - rollback logic
 * - postcondition verification
 */
type SendPayoutParams = {
  payoutId: string
  correlation?: AuditCorrelationContext
}

export async function sendPayout({ payoutId, correlation }: SendPayoutParams) {
  const safePayoutId = payoutId.trim()

  if (!safePayoutId) {
    throw new Error("Invalid payout id")
  }

  await executePayoutTerminalTransition({
    payoutId: safePayoutId,
    targetState: "paid",
    correlation,
  })

  return {
    payoutId: safePayoutId,
  }
}