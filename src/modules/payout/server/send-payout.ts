import { executePayoutTerminalTransition } from "./execute-payout-terminal-transition";

type SendPayoutParams = {
  payoutId: string;
};

export async function sendPayout({ payoutId }: SendPayoutParams) {
  const safePayoutId = payoutId.trim();

  if (!safePayoutId) {
    throw new Error("Invalid payout id");
  }

  await executePayoutTerminalTransition({
    payoutId: safePayoutId,
    targetState: "paid",
  });

  return {
    payoutId: safePayoutId,
  };
}