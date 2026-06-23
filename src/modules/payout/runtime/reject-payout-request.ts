import { rejectPayoutRequestLifecycle } from "@/modules/payout/services/payout-request-rejection-service"
import { createAndTracePayout } from "@/shared/observability/payout-trace"

/**
 * Canonical request-phase rejection flow.
 *
 * This file owns payout request rejection only.
 * It is NOT part of canonical payout terminal paid/failed execution authority.
 *
 * Separation of concerns:
 * - request-phase reject authority: this file
 * - terminal payout paid/failed authority: execute-payout-terminal-transition.ts
 */
type RejectPayoutRequestParams = {
  payoutRequestId: string
}

function normalizePayoutRequestId(payoutRequestId: string): string {
  const safePayoutRequestId = payoutRequestId.trim()

  if (!safePayoutRequestId) {
    throw new Error("Invalid payout request id")
  }

  return safePayoutRequestId
}

export async function rejectPayoutRequest({
  payoutRequestId,
}: RejectPayoutRequestParams): Promise<void> {
  const safePayoutRequestId = normalizePayoutRequestId(payoutRequestId)

  await rejectPayoutRequestLifecycle({
    payoutRequestId: safePayoutRequestId,
  })

  createAndTracePayout({
    phase: "request_rejected",
    authority: "payout_request_rejection",
    payoutRequestId: safePayoutRequestId,
    actor: {
      actorType: "system",
      actorId: null,
    },
    linkedEarningIds: [],
    source: {
      sourceFile: "src/modules/payout/runtime/reject-payout-request.ts",
      operationName: "rejectPayoutRequest",
    },
    metadata: {},
  })
}