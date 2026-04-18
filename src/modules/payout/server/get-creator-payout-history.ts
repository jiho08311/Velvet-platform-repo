import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { requireUser } from "@/modules/auth/server/require-user"
import { resolvePayoutExecutionProjection } from "@/modules/payout/lib/resolve-payout-execution-projection"
import type { PayoutExecutionLifecycleState } from "@/modules/payout/lib/resolve-payout-state"

/**
 * Canonical authenticated reader for the current user's creator payout history.
 *
 * Use this file when:
 * - the caller is the signed-in creator
 * - the screen wants "my payout history"
 *
 * This file is an authenticated read-model only.
 * It must not:
 * - interpret payout request lifecycle
 * - infer retryability from failed payouts
 * - define terminal payout policy
 *
 * Source-of-truth boundaries:
 * - execution lifecycle meaning comes from resolve-payout-state.ts
 * - failed terminal behavior comes from execute-payout-terminal-transition.ts
 *
 * Do not treat this file as the generic creatorId-based payout list reader.
 * That role belongs to list-creator-payouts.ts.
 */
type CreatorPayoutHistoryRow = {
  id: string
  amount: number | null
  currency: string | null
  status: "pending" | "processing" | "paid" | "failed"
  paid_at: string | null
  failure_reason: string | null
  created_at: string
}

export type CreatorPayoutHistoryItem = {
  id: string
  amount: number
  currency: string
  status: "pending" | "processing" | "paid" | "failed"
  lifecycleState: PayoutExecutionLifecycleState
  paidAt: string | null
  failureReason: string | null
  createdAt: string
}

function toCreatorPayoutHistoryItem(
  row: CreatorPayoutHistoryRow
): CreatorPayoutHistoryItem {
  const projection = resolvePayoutExecutionProjection({
    id: row.id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    createdAt: row.created_at,
    paidAt: row.paid_at,
    failureReason: row.failure_reason,
  })

  return {
    id: projection.id,
    amount: projection.amount,
    currency: projection.currency,
    status: projection.status,
    lifecycleState: projection.lifecycleState,
    paidAt: projection.paidAt,
    failureReason: projection.failureReason,
    createdAt: projection.createdAt,
  }
}

export async function getCreatorPayoutHistory(): Promise<
  CreatorPayoutHistoryItem[]
> {
  const user = await requireUser()

  const { data: creator, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (creatorError || !creator) {
    throw new Error("Creator not found")
  }

  const { data: payouts, error: payoutsError } = await supabaseAdmin
    .from("payouts")
    .select(
      "id, amount, currency, status, paid_at, failure_reason, created_at"
    )
    .eq("creator_id", creator.id)
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<CreatorPayoutHistoryRow[]>()

  if (payoutsError) {
    throw payoutsError
  }

  return (payouts ?? []).map(toCreatorPayoutHistoryItem)
}