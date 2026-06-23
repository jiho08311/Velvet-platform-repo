import {
  getAnalytics as getAnalyticsRuntime,
} from "@/modules/payment/runtime/get-analytics"

export const PUBLIC_CONTRACT = true

export type AdminAnalytics = Awaited<ReturnType<typeof getAnalyticsRuntime>>

export async function getAnalytics(): Promise<AdminAnalytics> {
  return getAnalyticsRuntime()
}
