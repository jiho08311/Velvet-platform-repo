import {
  listCreatorAnalyticsMonthlyPaymentRows,
  listCreatorAnalyticsTotalPaymentRows,
  type CreatorAnalyticsPaymentAmountRow,
  type CreatorAnalyticsPaymentRow,
  type PaymentAnalyticsQueryResult,
} from "@/modules/payment/repositories/payment-read-repository"

type ListCreatorAnalyticsPaymentsInput = {
  creatorId: string
  periodStart: string
}

export type {
  CreatorAnalyticsPaymentAmountRow,
  CreatorAnalyticsPaymentRow,
  PaymentAnalyticsQueryResult,
}

export async function listCreatorAnalyticsPayments({
  creatorId,
  periodStart,
}: ListCreatorAnalyticsPaymentsInput): Promise<{
  totalPaymentsResult: PaymentAnalyticsQueryResult<CreatorAnalyticsPaymentAmountRow>
  monthlyPaymentsResult: PaymentAnalyticsQueryResult<CreatorAnalyticsPaymentRow>
}> {
  const [totalPaymentsResult, monthlyPaymentsResult] = await Promise.all([
    listCreatorAnalyticsTotalPaymentRows(creatorId),
    listCreatorAnalyticsMonthlyPaymentRows({ creatorId, periodStart }),
  ])

  return {
    totalPaymentsResult,
    monthlyPaymentsResult,
  }
}
