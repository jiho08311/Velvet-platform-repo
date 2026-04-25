import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import {
  buildPayoutRequestReadModel,
  type PayoutRequestReadModel,
  type PayoutRequestRow,
} from "@/modules/payout/server/build-payout-request-read-model"

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

export type PayoutRequest = Omit<
  PayoutRequestReadModel,
  "approvedAt" | "rejectedAt"
>

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

  return (data ?? []).map((row: PayoutRequestRow) => {
    const readModel = buildPayoutRequestReadModel(row)

    return {
      id: readModel.id,
      creatorId: readModel.creatorId,
      amount: readModel.amount,
      currency: readModel.currency,
      status: readModel.status,
      lifecycleState: readModel.lifecycleState,
      createdAt: readModel.createdAt,
    }
  })
}
