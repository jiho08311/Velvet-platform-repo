import {
  listLinkedRequestedEarningRows,
  releaseRequestedEarningRowsForPayoutRequest,
} from "@/modules/payout/repositories/earning-write-repository"
import { verifyReleasedPayoutRequestEarningsPostcondition } from "@/modules/payout/services/payout-postcondition-service"

/**
 * Request-phase helper only.
 *
 * This file is the earnings release helper for payout request rejection flow.
 * It is NOT the canonical failed terminal payout authority.
 *
 * Canonical failed terminal payout authority lives in:
 * - execute-payout-terminal-transition.ts
 *
 * Use this helper only when rejecting a payout request before terminal payout execution.
 * Do not reuse this helper as the source of truth for payout failed terminal behavior.
 */
type ReleasePayoutRequestEarningsParams = {
  payoutRequestId: string
}

function normalizePayoutRequestId(payoutRequestId: string): string {
  const safePayoutRequestId = payoutRequestId.trim()

  if (!safePayoutRequestId) {
    throw new Error("Invalid payout request id")
  }

  return safePayoutRequestId
}

export async function releasePayoutRequestEarnings({
  payoutRequestId,
}: ReleasePayoutRequestEarningsParams): Promise<string[]> {
  const safePayoutRequestId = normalizePayoutRequestId(payoutRequestId)

  const linkedRequestedEarnings = await listLinkedRequestedEarningRows(
    safePayoutRequestId
  )

  const linkedRequestedEarningIds = linkedRequestedEarnings.map(
    (earning) => earning.id
  )

  if (linkedRequestedEarningIds.length === 0) {
    return []
  }

  const releasedEarnings = await releaseRequestedEarningRowsForPayoutRequest({
    payoutRequestId: safePayoutRequestId,
    earningIds: linkedRequestedEarningIds,
  })

  if (releasedEarnings.length !== linkedRequestedEarningIds.length) {
    throw new Error("FAILED_TO_RELEASE_ALL_LINKED_EARNINGS")
  }

  await verifyReleasedPayoutRequestEarningsPostcondition({
    releasedEarningIds: linkedRequestedEarningIds,
  })

  return linkedRequestedEarningIds
}