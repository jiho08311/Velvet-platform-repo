import { rejectCanonicalPayoutRequest } from "@/modules/commerce/internal/adapters/payout-adapter"
import type {
  RejectPayoutRequestInput,
  RejectPayoutRequestResult,
} from "@/modules/commerce/public/payout-contract"

export async function rejectPayoutRequestUseCase(
  input: RejectPayoutRequestInput
): Promise<RejectPayoutRequestResult> {
  await rejectCanonicalPayoutRequest({
    payoutRequestId: input.payoutRequestId,
  })

  return {
    payoutRequestId: input.payoutRequestId,
  }
}