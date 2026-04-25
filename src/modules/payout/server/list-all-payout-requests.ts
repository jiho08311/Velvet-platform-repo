import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import {
  buildPayoutRequestReadModel,
  type PayoutRequestReadModel,
  type PayoutRequestRow,
} from "@/modules/payout/server/build-payout-request-read-model"

export type PayoutRequest = PayoutRequestReadModel

export async function listAllPayoutRequests(): Promise<PayoutRequest[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("payout_requests")
    .select(
      "id, creator_id, amount, currency, status, created_at, approved_at, rejected_at"
    )
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map(buildPayoutRequestReadModel)
}
