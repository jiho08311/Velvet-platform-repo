import {
  getAdminPaymentAnalytics as getAdminPaymentAnalyticsRuntime,
} from "@/modules/payment/runtime/get-admin-payment-analytics"

export const PUBLIC_CONTRACT = true

export type AdminPaymentAnalyticsResult = Awaited<
  ReturnType<typeof getAdminPaymentAnalyticsRuntime>
>

export type PaymentAnalyticsAmountRow = NonNullable<
  AdminPaymentAnalyticsResult["data"]
>[number]

export type PaymentAnalyticsQueryResult<T> = Omit<
  AdminPaymentAnalyticsResult,
  "data"
> & {
  data: T[]
}

export async function getAdminPaymentAnalytics(): Promise<AdminPaymentAnalyticsResult> {
  return getAdminPaymentAnalyticsRuntime()
}
