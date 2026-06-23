import { recordFinancialOperationAudit as createAuditLog } from "@/modules/governance/public/audit-contract"
import { approvePayoutRequestLifecycle } from "@/modules/payout/services/payout-request-approval-service"
import { createAndTracePayout } from "@/shared/observability/payout-trace"

type ApprovePayoutRequestParams = {
  payoutRequestId: string
}

function normalizePayoutRequestId(payoutRequestId: string): string {
  const safePayoutRequestId = payoutRequestId.trim()

  if (!safePayoutRequestId) {
    throw new Error("Invalid payout request id")
  }

  return safePayoutRequestId
}

export async function approvePayoutRequest({
  payoutRequestId,
}: ApprovePayoutRequestParams): Promise<void> {
  const safePayoutRequestId = normalizePayoutRequestId(payoutRequestId)

  const approvedRow = await approvePayoutRequestLifecycle({
    payoutRequestId: safePayoutRequestId,
  })

  createAndTracePayout({
    phase: "request_approved",
    authority: "payout_request_approval",
    payoutId: approvedRow.payoutId,
    payoutRequestId: safePayoutRequestId,
    actor: {
      actorType: "system",
      actorId: null,
    },
    linkedEarningIds: [],
    source: {
      sourceFile: "src/modules/payout/runtime/approve-payout-request.ts",
      operationName: "approvePayoutRequest",
    },
    metadata: {
      creatorId: approvedRow.creatorId,
      amount: approvedRow.amount,
      currency: approvedRow.currency,
    },
  })

  await createAuditLog({
    actorId: null,
    action: "payout_approved",
    targetType: "payout_request",
    targetId: safePayoutRequestId,
    metadata: {
      payoutId: approvedRow.payoutId,
      creatorId: approvedRow.creatorId,
      amount: approvedRow.amount,
      currency: approvedRow.currency,
    },
  })
}