import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { requireUser } from "@/modules/auth/server/require-user"
import {
  buildPayoutExecutionReadModel,
  type PayoutExecutionReadModel,
  type PayoutExecutionRow,
} from "@/modules/payout/server/build-payout-execution-read-model"

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
export type CreatorPayoutHistoryItem = PayoutExecutionReadModel

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
    .returns<PayoutExecutionRow[]>()

  if (payoutsError) {
    throw payoutsError
  }

  return (payouts ?? []).map(buildPayoutExecutionReadModel)
}
