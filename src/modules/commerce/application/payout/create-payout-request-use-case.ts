import { createCanonicalPayoutRequest } from "@/modules/commerce/internal/adapters/payout-adapter"
import type {
  CreatePayoutRequestInput,
  CreatePayoutRequestResult,
} from "@/modules/commerce/public/payout-contract"
import type {
  CommerceCurrency,
  PayoutRequestState,
} from "@/modules/commerce/public/types"

function toCommerceCurrency(currency: string): CommerceCurrency {
  if (currency !== "KRW") {
    throw new Error(`Unsupported commerce currency: ${currency}`)
  }

  return currency
}

function toPayoutRequestState(input: {
  id: string
  creatorId: string
  amount: number
  currency: string
  status: PayoutRequestState["status"]
  createdAt: string
}): PayoutRequestState {
  return {
    payoutRequestId: input.id,
    creatorId: input.creatorId,
    money: {
      amount: input.amount,
      currency: toCommerceCurrency(input.currency),
    },
    status: input.status,
    createdAt: input.createdAt,
    approvedAt: null,
    rejectedAt: null,
  }
}

export async function createPayoutRequestUseCase(
  input: CreatePayoutRequestInput
): Promise<CreatePayoutRequestResult> {
const payoutRequest = await createCanonicalPayoutRequest({
  creatorId: input.creatorId,
  amount: input.amount,
currency: input.currency ? toCommerceCurrency(input.currency) : undefined,
})

  return {
    payoutRequest: toPayoutRequestState(payoutRequest),
  }
}