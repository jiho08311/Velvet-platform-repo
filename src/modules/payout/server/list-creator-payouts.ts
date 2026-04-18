import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { resolvePayoutExecutionProjection } from "@/modules/payout/lib/resolve-payout-execution-projection"
import type { PayoutExecutionLifecycleState } from "@/modules/payout/lib/resolve-payout-state"

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

type CreatorPayoutRow = {
  id: string
  amount: number | null
  currency: string | null
  status: "pending" | "processing" | "paid" | "failed"
  created_at: string
  paid_at: string | null
  failure_reason: string | null
}

export type CreatorPayout = {
  id: string
  amount: number
  currency: string
  status: "pending" | "processing" | "paid" | "failed"
  lifecycleState: PayoutExecutionLifecycleState
  createdAt: string
  paidAt: string | null
  failureReason: string | null
}

function toCreatorPayout(row: CreatorPayoutRow): CreatorPayout {
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
    createdAt: projection.createdAt,
    paidAt: projection.paidAt,
    failureReason: projection.failureReason,
  }
}

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
    .returns<CreatorPayoutRow[]>()

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(toCreatorPayout)
}