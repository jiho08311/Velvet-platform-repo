import {
  buildPayoutExecutionReadModel,
  type PayoutExecutionReadModel,
} from "@/modules/payout/mappers/build-payout-execution-read-model"
import { listPayoutRowsByCreatorId } from "@/modules/payout/repositories/payout-read-repository"

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
  const safeCreatorId = creatorId.trim()

  if (!safeCreatorId) {
    return []
  }

  const rows = await listPayoutRowsByCreatorId(safeCreatorId)
  const payouts = rows.map(buildPayoutExecutionReadModel)

  return payouts
}
