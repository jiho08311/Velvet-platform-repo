import {
  failPayout,
  getCanonicalPayoutIdByRequestId,
} from "@/modules/commerce/public/payout-contract"

/**
 * Admin failed adapter only.
 *
 * Responsibility boundary:
 * - accepts admin request-scoped payoutRequestId
 * - resolves payoutRequestId -> payoutId through commerce payout boundary
 * - delegates to canonical payout failed entry
 *
 * This file must never own:
 * - payout execution policy
 * - payout terminal writes
 * - linked earnings failed/release writes
 * - rollback / postcondition logic
 */
export async function markPayoutAsFailed(payoutRequestId: string) {
  const safePayoutRequestId = payoutRequestId.trim()
  const payoutId = await getCanonicalPayoutIdByRequestId(safePayoutRequestId)

  await failPayout({
    payoutId,
    reason: "Marked as failed by admin",
  })

  return {
    payoutId,
    payoutRequestId: safePayoutRequestId,
  }
}
