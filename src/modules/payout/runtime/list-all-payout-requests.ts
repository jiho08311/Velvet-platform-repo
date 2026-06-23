import {
  buildPayoutRequestReadModel,
  type PayoutRequestReadModel,
} from "@/modules/payout/mappers/build-payout-request-read-model"
import { listAllPayoutRequestRows } from "@/modules/payout/repositories/payout-request-read-repository"

export type PayoutRequest = PayoutRequestReadModel

export async function listAllPayoutRequests(): Promise<PayoutRequest[]> {
  const rows = await listAllPayoutRequestRows()

  return rows.map(buildPayoutRequestReadModel)
}