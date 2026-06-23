import {
  getCanonicalPayoutIdByRequestId,
  sendPayout,
} from "@/modules/commerce/public/payout-contract"

/**
 * Admin paid adapter only.
 *
 * Responsibility boundary:
 * - accepts admin request-scoped payoutRequestId
 * - resolves payoutRequestId -> payoutId through commerce payout boundary
 * - delegates to canonical payout-domain paid entry
 *
 * This file must never own:
 * - payout execution policy
 * - payout terminal writes
 * - linked earnings paid_out writes
 * - rollback / postcondition logic
 */
export async function markPayoutAsPaid(payoutRequestId: string) {
  const safePayoutRequestId = payoutRequestId.trim()
  const payoutId = await getCanonicalPayoutIdByRequestId(safePayoutRequestId)

  await sendPayout({ payoutId })

  return {
    payoutId,
    payoutRequestId: safePayoutRequestId,
  }
}
