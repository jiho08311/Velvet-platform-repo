import { findPayoutIdByRequestIdOrThrow } from "@/modules/payout/repositories/payout-read-repository"

export const PUBLIC_CONTRACT = true

export async function getPayoutIdByRequestId(
  payoutRequestId: string
): Promise<string> {
  const safePayoutRequestId = payoutRequestId.trim()

  if (!safePayoutRequestId) {
    throw new Error("invalid payoutRequestId")
  }

  return findPayoutIdByRequestIdOrThrow(safePayoutRequestId)
}
