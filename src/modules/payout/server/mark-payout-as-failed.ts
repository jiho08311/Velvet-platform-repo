import { executePayoutTerminalTransition } from "./execute-payout-terminal-transition";

/**
 * Canonical public failed-entry for payout execution.
 *
 * This file is intentionally thin:
 * - accepts payout intent = failed
 * - delegates all terminal execution business logic to executePayoutTerminalTransition
 *
 * It must never own:
 * - payout status validation policy
 * - linked earnings failure/release policy
 * - rollback logic
 * - postcondition verification
 */
type MarkPayoutAsFailedParams = {
  payoutId: string;
  failureReason?: string;
};

export async function markPayoutAsFailed({
  payoutId,
  failureReason,
}: MarkPayoutAsFailedParams) {
  const safePayoutId = payoutId.trim();

  if (!safePayoutId) {
    throw new Error("invalid payoutId");
  }

  await executePayoutTerminalTransition({
    payoutId: safePayoutId,
    targetState: "failed",
    failureReason,
  });

  return {
    payoutId: safePayoutId,
  };
}