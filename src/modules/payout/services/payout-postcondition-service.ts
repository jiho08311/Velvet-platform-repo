import {
  listEarningRowsByIds,
} from "@/modules/payout/repositories/earning-write-repository"
import {
  listPayoutLinkedEarningRowsByIds,
} from "@/modules/payout/repositories/earning-read-repository"
import { findPayoutTerminalRowOrThrow } from "@/modules/payout/repositories/payout-read-repository"
import { findPayoutRequestLifecycleRowOrThrow } from "@/modules/payout/repositories/payout-request-write-repository"

export async function verifyApprovedPayoutRequestPostcondition({
  payoutRequestId,
}: {
  payoutRequestId: string
}): Promise<void> {
  const payoutRequest =
    await findPayoutRequestLifecycleRowOrThrow(payoutRequestId)

  if (payoutRequest.status !== "approved") {
    throw new Error("PAYOUT_REQUEST_NOT_APPROVED")
  }

  if (!payoutRequest.approved_at) {
    throw new Error("PAYOUT_REQUEST_APPROVED_AT_MISSING")
  }
}

export async function verifyRejectedPayoutRequestPostcondition({
  payoutRequestId,
}: {
  payoutRequestId: string
}): Promise<void> {
  const payoutRequest =
    await findPayoutRequestLifecycleRowOrThrow(payoutRequestId)

  if (payoutRequest.status !== "rejected") {
    throw new Error("PAYOUT_REQUEST_REJECT_POSTCONDITION_FAILED")
  }

  if (!payoutRequest.rejected_at) {
    throw new Error("PAYOUT_REQUEST_REJECTED_AT_MISSING")
  }
}

export async function verifyReleasedPayoutRequestEarningsPostcondition({
  releasedEarningIds,
}: {
  releasedEarningIds: string[]
}): Promise<void> {
  if (releasedEarningIds.length === 0) {
    return
  }

  const rows = await listEarningRowsByIds(releasedEarningIds)

  if (rows.length !== releasedEarningIds.length) {
    throw new Error("RELEASE_PAYOUT_REQUEST_EARNINGS_COUNT_MISMATCH")
  }

  const hasInvalidRow = rows.some((row) => {
    return (
      row.status !== "available" ||
      row.payout_request_id !== null ||
      row.payout_id !== null
    )
  })

  if (hasInvalidRow) {
    throw new Error("RELEASE_PAYOUT_REQUEST_EARNINGS_POSTCONDITION_FAILED")
  }
}

export async function verifyPaidPayoutExecutionPostcondition({
  payoutId,
  earningIds,
}: {
  payoutId: string
  earningIds: string[]
}): Promise<void> {
  const payout = await findPayoutTerminalRowOrThrow(payoutId)

  if (payout.status !== "paid") {
    throw new Error("PAYOUT_PAID_POSTCONDITION_FAILED")
  }

  if (earningIds.length === 0) {
    return
  }

  const rows = await listPayoutLinkedEarningRowsByIds(earningIds)

  if (rows.length !== earningIds.length) {
    throw new Error("PAID_EARNINGS_POSTCONDITION_COUNT_MISMATCH")
  }

  const hasInvalidRow = rows.some((row) => {
    return (
      row.status !== "paid_out" ||
      row.payout_id !== payoutId ||
      !row.paid_out_at
    )
  })

  if (hasInvalidRow) {
    throw new Error("PAID_EARNINGS_POSTCONDITION_FAILED")
  }
}

export async function verifyFailedPayoutExecutionPostcondition({
  payoutId,
  releasedEarningIds,
}: {
  payoutId: string
  releasedEarningIds: string[]
}): Promise<void> {
  const payout = await findPayoutTerminalRowOrThrow(payoutId)

  if (payout.status !== "failed") {
    throw new Error("PAYOUT_FAILED_POSTCONDITION_FAILED")
  }

  if (releasedEarningIds.length === 0) {
    return
  }

  const rows = await listPayoutLinkedEarningRowsByIds(releasedEarningIds)

  if (rows.length !== releasedEarningIds.length) {
    throw new Error("FAILED_EARNINGS_POSTCONDITION_COUNT_MISMATCH")
  }

  const hasInvalidRow = rows.some((row) => {
    return (
      row.status !== "available" ||
      row.payout_id !== null ||
      row.payout_request_id !== null
    )
  })

  if (hasInvalidRow) {
    throw new Error("FAILED_EARNINGS_POSTCONDITION_FAILED")
  }
}