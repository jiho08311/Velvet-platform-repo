import { getPayoutAccountReadiness } from "./get-payout-account-readiness"
import {
  normalizeCreatePayoutRequestInput,
  type CreatePayoutRequestInput,
  type CreatePayoutRequestResult,
} from "../contracts/payout-request-contract"

import { recordFinancialOperationAudit as createAuditLog } from "@/modules/governance/public/audit-contract"
import { createPayoutRequestWithEarningsLock } from "@/modules/payout/services/payout-request-service"

export async function createPayoutRequest(
  input: CreatePayoutRequestInput
): Promise<CreatePayoutRequestResult> {
  const normalizedInput = normalizeCreatePayoutRequestInput(input)
  const { creatorId } = normalizedInput

  const accountReadiness = await getPayoutAccountReadiness({
    creatorId,
  })

  const payoutRequest = await createPayoutRequestWithEarningsLock({
    creatorId,
    requestedAmount: normalizedInput.requestedAmount,
    currency: normalizedInput.currency,
    accountReadinessState: accountReadiness.state,
  })

  await createAuditLog({
    actorId: creatorId,
    action: "payout_requested",
    targetType: "payout_request",
    targetId: payoutRequest.payoutRequestId,
    metadata: {
      amount: payoutRequest.amount,
      currency: payoutRequest.currency,
    },
  })

return {
  payoutRequestId: payoutRequest.payoutRequestId,
  id: payoutRequest.payoutRequestId,
  creatorId: payoutRequest.creatorId,
  amount: payoutRequest.amount,
  currency: payoutRequest.currency,
  status: payoutRequest.status,
  createdAt: payoutRequest.createdAt,
}
}