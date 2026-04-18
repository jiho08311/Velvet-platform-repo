import { rejectPayoutRequest as rejectCanonicalPayoutRequest } from "@/modules/payout/server/reject-payout-request";

export async function rejectPayoutRequest(payoutRequestId: string) {
  const safePayoutRequestId = payoutRequestId.trim();

  if (!safePayoutRequestId) {
    throw new Error("invalid payoutRequestId");
  }

  await rejectCanonicalPayoutRequest({
    payoutRequestId: safePayoutRequestId,
  });

  return {
    payoutRequestId: safePayoutRequestId,
  };
}