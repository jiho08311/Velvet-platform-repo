import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import {
  buildPayoutRequestReadModel,
  type PayoutRequestReadModel,
  type PayoutRequestRow,
} from "@/modules/payout/server/build-payout-request-read-model"

type GetPayoutRequestParams = {
  payoutRequestId: string
}

export type PayoutRequest = Omit<PayoutRequestReadModel, "rejectedAt">

export async function getPayoutRequest({
  payoutRequestId,
}: GetPayoutRequestParams): Promise<PayoutRequest | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("payout_requests")
    .select(
      "id, creator_id, amount, currency, status, created_at, approved_at"
    )
    .eq("id", payoutRequestId)
    .maybeSingle<PayoutRequestRow>()

  if (error) {
    throw error
  }

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
