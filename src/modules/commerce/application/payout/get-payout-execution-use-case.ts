import { getCanonicalPayoutById } from "@/modules/commerce/internal/adapters/payout-adapter"

import type {
  GetPayoutExecutionInput,
  GetPayoutExecutionResult,
} from "@/modules/commerce/public/payout-contract"

import type {
  CommerceCurrency,
  PayoutExecutionState,
  PayoutExecutionStatus,
} from "@/modules/commerce/public/types"

function toCommerceCurrency(
  currency: string
): CommerceCurrency {
  if (currency !== "KRW") {
    throw new Error(`Unsupported commerce currency: ${currency}`)
  }

  return currency
}

function toPayoutExecutionStatus(
  status: string
): PayoutExecutionStatus {
  switch (status) {
    case "pending":
    case "processing":
    case "paid":
    case "failed":
      return status

    default:
      throw new Error(
        `Unsupported payout execution status: ${status}`
      )
  }
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
    status: toPayoutExecutionStatus(row.status),
    createdAt: new Date().toISOString(),
    paidAt: row.paid_at,
    failureReason: row.failure_reason,
  }
}

export async function getPayoutExecutionUseCase(
  input: GetPayoutExecutionInput
): Promise<GetPayoutExecutionResult> {
  try {
    const payout = await getCanonicalPayoutById(
      input.payoutId
    )

    return {
      payout: toPayoutExecutionState(payout),
    }
  } catch {
    return {
      payout: null,
    }
  }
}