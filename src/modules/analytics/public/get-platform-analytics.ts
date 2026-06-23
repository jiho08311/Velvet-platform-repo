import {
  getPlatformAnalytics as getPlatformAnalyticsRuntime,
} from "@/modules/analytics/runtime/get-platform-analytics"

export const PUBLIC_CONTRACT = true

export type PlatformAnalytics = Awaited<ReturnType<typeof getPlatformAnalyticsRuntime>>

export function getPlatformAnalytics(): ReturnType<typeof getPlatformAnalyticsRuntime> {
  return getPlatformAnalyticsRuntime()
}
