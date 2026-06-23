import {
  buildPayoutRequestReadModel,
  type PayoutRequestReadModel,
} from "@/modules/payout/mappers/build-payout-request-read-model"
import { findPayoutRequestById } from "@/modules/payout/repositories/payout-request-read-repository"

type GetPayoutRequestParams = {
  payoutRequestId: string
}

export type PayoutRequest = Omit<PayoutRequestReadModel, "rejectedAt">

export async function getPayoutRequest({
  payoutRequestId,
}: GetPayoutRequestParams): Promise<PayoutRequest | null> {
  const data = await findPayoutRequestById(payoutRequestId)

  if (!data) {
    return null
  }

  const readModel = buildPayoutRequestReadModel(data)

  return {
    id: readModel.id,
    creatorId: readModel.creatorId,
    amount: readModel.amount,
    currency: readModel.currency,
    status: readModel.status,
    lifecycleState: readModel.lifecycleState,
    createdAt: readModel.createdAt,
    approvedAt: readModel.approvedAt,
  }
}