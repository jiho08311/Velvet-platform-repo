import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type PayoutRequestLifecycleState =
  | "pending_request"
  | "approved"
  | "rejected"
  | "inactive"

function resolvePayoutRequestLifecycleState(input: {
  payoutRequestStatus?: string | null
}): { state: PayoutRequestLifecycleState } {
  const payoutRequestStatus = input.payoutRequestStatus ?? null

  if (payoutRequestStatus === "rejected") {
    return { state: "rejected" }
  }

  if (payoutRequestStatus === "approved") {
    return { state: "approved" }
  }

  if (payoutRequestStatus === "pending") {
    return { state: "pending_request" }
  }

  return { state: "inactive" }
}

/**
 * Canonical creator-facing payout request list reader.
 *
 * Use this file when:
 * - the caller already has a creatorId
 * - the surface needs payout request rows from payout_requests
 * - the surface is showing request-phase state, not payout execution history
 *
 * This file must not be used for:
 * - payout execution history surfaces
 * - requestable / available balance calculation
 * - creator payout summary totals
 * - admin payout request management rows
 *
 * Source-of-truth boundary:
 * - reads request-phase rows from payout_requests
 * - request lifecycle meaning comes from resolve-payout-state.ts
 * - payout execution meaning belongs to payouts readers, not this file
 */
type ListPayoutRequestsParams = {
  creatorId: string
}

type PayoutRequestRow = {
  id: string
  creator_id: string
  amount: number
  currency: string
  status: string
  created_at: string
}

export type PayoutRequest = {
  id: string
  creatorId: string
  amount: number
  currency: string
  status: string
  lifecycleState: PayoutRequestLifecycleState
  createdAt: string
}

export async function listPayoutRequests({
  creatorId,
}: ListPayoutRequestsParams): Promise<PayoutRequest[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("payout_requests")
    .select("id, creator_id, amount, currency, status, created_at")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row: PayoutRequestRow) => ({
    id: row.id,
    creatorId: row.creator_id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    lifecycleState: resolvePayoutRequestLifecycleState({
      payoutRequestStatus: row.status,
    }).state,
    createdAt: row.created_at,
  }))
} 