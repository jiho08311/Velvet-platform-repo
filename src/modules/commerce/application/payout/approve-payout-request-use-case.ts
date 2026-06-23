import {
  approveCanonicalPayoutRequest,
  getCanonicalPayoutIdByRequestId,
} from "@/modules/commerce/internal/adapters/payout-adapter"
import type {
  ApprovePayoutRequestInput,
  ApprovePayoutRequestResult,
} from "@/modules/commerce/public/payout-contract"

export async function approvePayoutRequestUseCase(
  input: ApprovePayoutRequestInput
): Promise<ApprovePayoutRequestResult> {
  await approveCanonicalPayoutRequest({
    payoutRequestId: input.payoutRequestId,
  })

  const payoutId = await getCanonicalPayoutIdByRequestId(input.payoutRequestId)

  return {
    payoutRequestId: input.payoutRequestId,
    payoutId,
  }
}