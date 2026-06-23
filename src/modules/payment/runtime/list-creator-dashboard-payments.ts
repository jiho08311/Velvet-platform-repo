import {
  listCreatorDashboardPaymentRows,
  type CreatorDashboardPaymentRow,
} from "@/modules/payment/repositories/payment-read-repository"

type ListCreatorDashboardPaymentsInput = {
  creatorId: string
  monthStart: string
}

export type CreatorDashboardPaymentsResult = {
  monthlyPayments: CreatorDashboardPaymentRow[] | null
  totalPayments: CreatorDashboardPaymentRow[] | null
  monthlyError: unknown
  totalError: unknown
}

export async function listCreatorDashboardPayments({
  creatorId,
  monthStart,
}: ListCreatorDashboardPaymentsInput): Promise<CreatorDashboardPaymentsResult> {
  return listCreatorDashboardPaymentRows({
    creatorId,
    monthStart,
  })
}