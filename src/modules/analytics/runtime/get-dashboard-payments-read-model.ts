import { listCommerceCreatorPayments } from "@/modules/commerce/public/payment-contract"

type CreatorPaymentHistoryItem = Awaited<
  ReturnType<typeof listCommerceCreatorPayments>
>[number]

export type DashboardPaymentsReadModel = {
  payments: CreatorPaymentHistoryItem[]
}

export async function getDashboardPaymentsReadModel(
  creatorId: string
): Promise<DashboardPaymentsReadModel> {
  return {
    payments: await listCommerceCreatorPayments({
      creatorId,
    }),
  }
}