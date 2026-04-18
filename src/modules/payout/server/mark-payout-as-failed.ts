import { executePayoutTerminalTransition } from "./execute-payout-terminal-transition";

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