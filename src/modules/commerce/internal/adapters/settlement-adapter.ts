import { releasePendingEarnings } from "@/modules/payout/public/release-pending-earnings"
import { rejectPayoutRequest } from "@/modules/payout/public/reject-payout-request"

export async function releaseCanonicalPendingEarnings(input?: {
  holdDays?: number
  limit?: number
}) {
  return releasePendingEarnings(input)
}

export async function rejectCanonicalPayoutRequest(input: {
  payoutRequestId: string
}) {
  return rejectPayoutRequest(input)
}
