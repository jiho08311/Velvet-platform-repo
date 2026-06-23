import {
  listAdminPaymentAnalyticsRows,
  type PaymentAnalyticsAmountRow,
  type PaymentAnalyticsQueryResult,
} from "@/modules/payment/repositories/payment-read-repository"

export type { PaymentAnalyticsAmountRow, PaymentAnalyticsQueryResult }

export async function getAdminPaymentAnalytics(): Promise<
  PaymentAnalyticsQueryResult<PaymentAnalyticsAmountRow>
> {
  return listAdminPaymentAnalyticsRows()
}
