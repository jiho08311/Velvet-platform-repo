import type { CreatorPaymentHistoryItem } from "@/modules/payment/types"
import { toCreatorPaymentHistoryItem } from "@/modules/payment/mappers/payment-read-model-mapper"
import { listCreatorPaymentRows } from "@/modules/payment/repositories/payment-read-repository"

type ListCreatorPaymentsParams = {
  creatorId: string
}

export async function listCreatorPayments({
  creatorId,
}: ListCreatorPaymentsParams): Promise<CreatorPaymentHistoryItem[]> {
  const rows = await listCreatorPaymentRows({ creatorId })

  return rows.map(toCreatorPaymentHistoryItem)
}