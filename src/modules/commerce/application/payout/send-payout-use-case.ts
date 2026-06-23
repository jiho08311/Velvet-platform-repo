import {
  executeCanonicalPayout,
  getCanonicalPayoutById,
} from "@/modules/commerce/internal/adapters/payout-adapter"

import type {
  SendPayoutInput,
  SendPayoutResult,
} from "@/modules/commerce/public/payout-contract"
import type {
  CommerceCurrency,
  PayoutExecutionState,
} from "@/modules/commerce/public/types"

function toCommerceCurrency(currency: string): CommerceCurrency {
  if (currency !== "KRW") {
    throw new Error(`Unsupported commerce currency: ${currency}`)
  }

  return currency
}

function toPayoutExecutionState(
  row: Awaited<ReturnType<typeof getCanonicalPayoutById>>
): PayoutExecutionState {
  return {
    payoutId: row.id,
    payoutRequestId: row.payout_request_id,
    creatorId: row.creator_id,
    money: {
      amount: row.amount,
      currency: toCommerceCurrency(row.currency),
    },
    status: row.status,
    createdAt: new Date().toISOString(),
    paidAt: row.paid_at,
    failureReason: row.failure_reason,
  }
}

export async function sendPayoutUseCase(
  input: SendPayoutInput
): Promise<SendPayoutResult> {
  await executeCanonicalPayout({
    payoutId: input.payoutId,
  })

  const payout = await getCanonicalPayoutById(input.payoutId)

  return {
    payout: toPayoutExecutionState(payout),
  }
}