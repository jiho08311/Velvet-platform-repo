import {
  buildPayoutRequestReadModel,
  type PayoutRequestReadModel,
} from "@/modules/payout/mappers/build-payout-request-read-model"
import { listPayoutRequestsByCreatorId } from "@/modules/payout/repositories/payout-request-read-repository"

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
  const rows = await listPayoutRequestsByCreatorId(creatorId)

  const requests = rows.map((row) => {
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

  return requests
}
