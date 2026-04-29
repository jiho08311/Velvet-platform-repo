import { getCreatorEarningsBalance } from "./get-creator-earnings-balance"
import { getPayoutAccountReadiness } from "./get-payout-account-readiness"
import { resolvePayoutRequestEligibility } from "./resolve-payout-request-eligibility"
import {
  listCreatorPayouts,
  type CreatorPayout,
} from "@/modules/payout/server/list-creator-payouts"

/**
 * Canonical payout balance summary reader.
 *
 * Use this file for payout dashboard / summary surfaces that need:
 * - available/requestable balance
 * - pending requested payout amount
 * - payout request eligibility
 *
 * This file is a balance summary read-model only.
 * It must not:
 * - become the canonical payout history list source
 * - interpret payout request rejection vs execution failure wording
 * - infer retryability from failed payouts
 * - define terminal payout policy
 *
 * Source-of-truth boundaries:
 * - creator-facing balance totals come from payout-balance-policy.ts via getCreatorEarningsBalance()
 * - payout history lists come from list-creator-payouts.ts
 * - execution lifecycle meaning comes from resolve-payout-state.ts
 * - failed terminal behavior comes from execute-payout-terminal-transition.ts
 *
 * Compatibility boundary:
 * - recentPayouts is kept only as a backward-compatible summary snapshot field
 * - recentPayouts must be derived from the canonical payout history list source
 * - new dashboard/history surfaces must not use recentPayouts as their list source
 * - do not remove recentPayouts until all existing consumers are audited
 *
 * This file is not the source of truth for:
 * - authenticated creator payout history
 * - generic full payout list queries
 * - request-phase admin list views
 */
export type PayoutSummary = {
  creatorId: string
  currency: string
  requestableBalance: number
  requestedPayoutAmount: number
  requestEligibility: ReturnType<typeof resolvePayoutRequestEligibility>

  /**
   * Backward-compatible snapshot field.
   *
   * Do not use this as the canonical payout history source.
   * Creator-facing payout history must come from listCreatorPayouts().
   */
  recentPayouts: CreatorPayout[]
}

export async function getPayoutSummary(
  creatorId: string
): Promise<PayoutSummary | null> {
  const safeCreatorId = creatorId.trim()

  if (!safeCreatorId) {
    return null
  }

  const [earningsBalance, accountReadiness, payoutHistory] = await Promise.all([
    getCreatorEarningsBalance({
      creatorId: safeCreatorId,
    }),
    getPayoutAccountReadiness({
      creatorId: safeCreatorId,
    }),
    listCreatorPayouts({
      creatorId: safeCreatorId,
    }),
  ])

  const requestableBalance = earningsBalance?.requestableamount ?? 0

  const requestEligibility = resolvePayoutRequestEligibility({
    accountReadinessState: accountReadiness.state,
    requestedAmount: requestableBalance,
    availableBalance: requestableBalance,
  })

  return {
    creatorId: safeCreatorId,
    currency: earningsBalance?.currency ?? "KRW",
    requestableBalance,
    requestedPayoutAmount: earningsBalance?.requestedamount ?? 0,
    requestEligibility,
    recentPayouts: payoutHistory.slice(0, 5),
  }
}