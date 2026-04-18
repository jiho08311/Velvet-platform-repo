import { approvePayoutRequest as approveCanonicalPayoutRequest } from "@/modules/payout/server/approve-payout-request";

export async function approvePayoutRequest(payoutRequestId: string) {
  const safePayoutRequestId = payoutRequestId.trim();

  if (!safePayoutRequestId) {
    throw new Error("invalid payoutRequestId");
  }

  await approveCanonicalPayoutRequest({
    payoutRequestId: safePayoutRequestId,
  });

  return {
    payoutRequestId: safePayoutRequestId,
  };
}