import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { getCreatorEarningsBalance } from "./get-creator-earnings-balance"
import {
  buildPayoutExecutionReadModel,
  type PayoutExecutionReadModel,
  type PayoutExecutionRow,
} from "@/modules/payout/server/build-payout-execution-read-model"

/**
 * Canonical payout overview reader.
 *
 * Use this file for payout dashboard / summary surfaces that need:
 * - available balance
 * - pending request amount
 * - recent payout snapshots
 *
 * This file is a summary read-model only.
 * It must not:
 * - interpret payout request rejection vs execution failure wording
 * - infer retryability from failed payouts
 * - define terminal payout policy
 *
 * Source-of-truth boundaries:
 * - execution lifecycle meaning comes from resolve-payout-state.ts
 * - creator-facing balance totals come from payout-balance-policy.ts via getCreatorEarningsBalance()
 * - failed terminal behavior comes from execute-payout-terminal-transition.ts
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
  recentPayouts: PayoutExecutionReadModel[]
}

export async function getPayoutSummary(
  creatorId: string
): Promise<PayoutSummary | null> {
  const supabase = await createSupabaseServerClient()
  const safeCreatorId = creatorId.trim()

  if (!safeCreatorId) {
    return null
  }

  const earningsBalance = await getCreatorEarningsBalance({
    creatorId: safeCreatorId,
  })

  const { data: payouts, error: payoutsError } = await supabase
    .from("payouts")
    .select("id, amount, currency, status, created_at, paid_at, failure_reason")
    .eq("creator_id", safeCreatorId)
    .order("created_at", { ascending: false })
    .returns<PayoutExecutionRow[]>()

  if (payoutsError) {
    throw payoutsError
  }

  return {
    creatorId: safeCreatorId,
    currency: earningsBalance?.currency ?? "KRW",
    requestableBalance: earningsBalance?.requestableamount ?? 0,
    requestedPayoutAmount: earningsBalance?.requestedamount ?? 0,
    recentPayouts: (payouts ?? []).slice(0, 5).map(buildPayoutExecutionReadModel),
  }
}
