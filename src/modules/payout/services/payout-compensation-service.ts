import type { PayoutTerminalRow } from "@/modules/payout/repositories/payout-read-repository"
import { deletePayoutRequestRow } from "@/modules/payout/repositories/payout-request-write-repository"
import { restorePayoutTerminalRowState } from "@/modules/payout/repositories/payout-write-repository"

export async function compensateCreatedPayoutRequest(
  payoutRequestId: string
): Promise<void> {
  await deletePayoutRequestRow(payoutRequestId)
}

export async function compensatePayoutTerminalRowState({
  payoutId,
  status,
  paidAt,
  failureReason,
}: {
  payoutId: string
  status: PayoutTerminalRow["status"]
  paidAt: string | null
  failureReason: string | null
}): Promise<void> {
  await restorePayoutTerminalRowState({
    payoutId,
    status,
    paidAt,
    failureReason,
  })
}