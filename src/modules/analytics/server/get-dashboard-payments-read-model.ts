import { listCreatorPayments } from "@/modules/payment/server/list-creator-payments"
import type { CreatorPaymentHistoryItem } from "@/modules/payment/types"

export type DashboardPaymentsReadModel = {
  payments: CreatorPaymentHistoryItem[]
}

export async function getDashboardPaymentsReadModel(
  creatorId: string
): Promise<DashboardPaymentsReadModel> {
  return {
    payments: await listCreatorPayments({
      creatorId,
    }),
  }
}
