import { getCanonicalPayoutRequest } from "@/modules/commerce/internal/adapters/payout-adapter"

import type {
  GetPayoutRequestInput,
  GetPayoutRequestResult,
} from "@/modules/commerce/public/payout-contract"

import type {
  CommerceCurrency,
  PayoutRequestState,
  PayoutRequestStatus,
} from "@/modules/commerce/public/types"

function toCommerceCurrency(currency: string): CommerceCurrency {
  if (currency !== "KRW") {
    throw new Error(`Unsupported commerce currency: ${currency}`)
  }

  return currency
}

function toPayoutRequestStatus(
  status: string
): PayoutRequestStatus {
  switch (status) {
    case "pending":
    case "approved":
    case "rejected":
      return status

    default:
      throw new Error(
        `Unsupported payout request status: ${status}`
      )
  }
}

function toPayoutRequestState(
  row: NonNullable<
    Awaited<ReturnType<typeof getCanonicalPayoutRequest>>
  >
): PayoutRequestState {
  return {
    payoutRequestId: row.id,
    creatorId: row.creatorId,
    money: {
      amount: row.amount,
      currency: toCommerceCurrency(row.currency),
    },
    status: toPayoutRequestStatus(row.status),
    createdAt: row.createdAt,
    approvedAt: row.approvedAt ?? null,
    rejectedAt: null,
  }
}

export async function getPayoutRequestUseCase(
  input: GetPayoutRequestInput
): Promise<GetPayoutRequestResult> {
  const payoutRequest =
    await getCanonicalPayoutRequest({
      payoutRequestId: input.payoutRequestId,
    })

  return {
    payoutRequest: payoutRequest
      ? toPayoutRequestState(payoutRequest)
      : null,
  }
}