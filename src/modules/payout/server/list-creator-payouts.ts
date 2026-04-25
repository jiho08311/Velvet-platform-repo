import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import {
  buildPayoutExecutionReadModel,
  type PayoutExecutionReadModel,
  type PayoutExecutionRow,
} from "@/modules/payout/server/build-payout-execution-read-model"

/**
 * Canonical generic creatorId-based payout execution history reader.
 *
 * Use this file when:
 * - the caller already has a creatorId
 * - the surface needs creator payout execution rows
 * - the surface is showing actual payouts from the payouts table
 *
 * This file is the generic creator-facing execution list source.
 *
 * It must not be used for:
 * - payout request list surfaces
 * - requestable / available balance calculation
 * - pending request amount summaries
 * - admin payout request management rows
 *
 * Source-of-truth boundary:
 * - reads payout execution history from payouts
 * - execution lifecycle meaning comes from resolve-payout-state.ts
 * - creator request-phase meaning belongs to payout_requests readers, not this file
 */
type ListCreatorPayoutsParams = {
  creatorId: string
}

export type CreatorPayout = PayoutExecutionReadModel

export async function listCreatorPayouts({
  creatorId,
}: ListCreatorPayoutsParams): Promise<CreatorPayout[]> {
  const supabase = await createSupabaseServerClient()
  const safeCreatorId = creatorId.trim()

  if (!safeCreatorId) {
    return []
  }

  const { data, error } = await supabase
    .from("payouts")
    .select(
      "id, amount, currency, status, created_at, paid_at, failure_reason"
    )
    .eq("creator_id", safeCreatorId)
    .order("created_at", { ascending: false })
    .returns<PayoutExecutionRow[]>()

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(buildPayoutExecutionReadModel)
}
