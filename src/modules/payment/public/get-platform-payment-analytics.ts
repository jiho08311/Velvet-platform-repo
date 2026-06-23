import {
  getPlatformPaymentAnalytics as getPlatformPaymentAnalyticsRuntime,
} from "@/modules/payment/runtime/get-platform-payment-analytics"

export const PUBLIC_CONTRACT = true

export type PlatformPaymentAnalyticsResult = Awaited<
  ReturnType<typeof getPlatformPaymentAnalyticsRuntime>
>

export type PaymentAnalyticsAmountRow =
  NonNullable<PlatformPaymentAnalyticsResult["data"]>[number]

export type PaymentAnalyticsQueryResult<T> = Omit<
  PlatformPaymentAnalyticsResult,
  "data"
> & {
  data: T[]
}

export async function getPlatformPaymentAnalytics(): Promise<PlatformPaymentAnalyticsResult> {
  return getPlatformPaymentAnalyticsRuntime()
}
