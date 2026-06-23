import {
  listPlatformPaymentAnalyticsRows,
  type PaymentAnalyticsAmountRow,
  type PaymentAnalyticsQueryResult,
} from "@/modules/payment/repositories/payment-read-repository"

export type { PaymentAnalyticsAmountRow, PaymentAnalyticsQueryResult }

export async function getPlatformPaymentAnalytics(): Promise<
  PaymentAnalyticsQueryResult<PaymentAnalyticsAmountRow>
> {
  return listPlatformPaymentAnalyticsRows()
}
