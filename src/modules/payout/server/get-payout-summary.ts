import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { getCreatorEarningsBalance } from "./get-creator-earnings-balance"
import { resolvePayoutExecutionProjection } from "@/modules/payout/lib/resolve-payout-execution-projection"
import type { PayoutExecutionLifecycleState } from "@/modules/payout/lib/resolve-payout-state"

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
type PayoutRow = {
  id: string
  amount: number | null
  status: "pending" | "processing" | "paid" | "failed"
  created_at: string
}

export type PayoutSummary = {
  creatorId: string
  currency: string
  availableBalance: number
  pendingAmount: number
  recentPayouts: Array<{
    id: string
    amount: number
    status: "pending" | "processing" | "paid" | "failed"
    lifecycleState: PayoutExecutionLifecycleState
    createdAt: string
  }>
}

function toRecentPayout(row: PayoutRow): PayoutSummary["recentPayouts"][number] {
  const projection = resolvePayoutExecutionProjection({
    id: row.id,
    amount: row.amount,
    currency: "KRW",
    status: row.status,
    createdAt: row.created_at,
  })

  return {
    id: projection.id,
    amount: projection.amount,
    status: projection.status,
    lifecycleState: projection.lifecycleState,
    createdAt: projection.createdAt,
  }
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
    .select("id, amount, status, created_at")
    .eq("creator_id", safeCreatorId)
    .order("created_at", { ascending: false })
    .returns<PayoutRow[]>()

  if (payoutsError) {
    throw payoutsError
  }

  return {
    creatorId: safeCreatorId,
    currency: earningsBalance?.currency ?? "KRW",
    availableBalance: earningsBalance?.requestableamount ?? 0,
    pendingAmount: earningsBalance?.requestedamount ?? 0,
    recentPayouts: (payouts ?? []).slice(0, 5).map(toRecentPayout),
  }
}