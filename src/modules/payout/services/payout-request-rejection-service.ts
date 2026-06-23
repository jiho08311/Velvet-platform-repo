import { assertRejectablePayoutRequest } from "@/modules/payout/policies/payout-request-lifecycle-policy"
import {
  findPayoutRequestLifecycleRowOrThrow,
  markPayoutRequestRowAsRejected,
  restorePayoutRequestRejectionState,
} from "@/modules/payout/repositories/payout-request-write-repository"
import { releasePayoutRequestEarnings } from "@/modules/payout/runtime/release-payout-request-earnings"
import { verifyRejectedPayoutRequestPostcondition } from "@/modules/payout/services/payout-postcondition-service"

export async function rejectPayoutRequestLifecycle({
  payoutRequestId,
}: {
  payoutRequestId: string
}): Promise<void> {
  const payoutRequest =
    await findPayoutRequestLifecycleRowOrThrow(payoutRequestId)

  assertRejectablePayoutRequest({
    payoutRequestStatus: payoutRequest.status,
  })

  const rejectedAt = new Date().toISOString()

  await markPayoutRequestRowAsRejected({
    payoutRequestId,
    rejectedAt,
  })

  try {
    await releasePayoutRequestEarnings({
      payoutRequestId,
    })
  } catch (error) {
    await restorePayoutRequestRejectionState({
      payoutRequestId,
      status: payoutRequest.status,
      rejectedAt: payoutRequest.rejected_at,
    })

    throw error
  }

  await verifyRejectedPayoutRequestPostcondition({
    payoutRequestId,
  })
}