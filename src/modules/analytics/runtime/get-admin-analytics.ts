import { readAdminDashboardSnapshot } from "@/modules/analytics/repositories/dashboard-snapshot-repository"

export type AdminAnalyticsSummary = {
  totalUsers: number
  totalRevenue: number
  activeCreators: number
  openReports: number
  currency?: string
}

function readNumber(metrics: Record<string, unknown>, key: string): number {
  const value = metrics[key]
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function readString(
  metrics: Record<string, unknown>,
  key: string,
  fallback: string
): string {
  const value = metrics[key]
  return typeof value === "string" ? value : fallback
}

export async function getAdminAnalytics(): Promise<AdminAnalyticsSummary> {
  const snapshot = await readAdminDashboardSnapshot("platform")

  if (!snapshot) {
    return {
      totalUsers: 0,
      totalRevenue: 0,
      activeCreators: 0,
      openReports: 0,
      currency: "KRW",
    }
  }

  return {
    totalUsers: readNumber(snapshot.metrics, "totalUsers"),
    totalRevenue: readNumber(snapshot.metrics, "totalRevenue"),
    activeCreators: readNumber(snapshot.metrics, "activeCreators"),
    openReports: readNumber(snapshot.metrics, "openReports"),
    currency: readString(snapshot.metrics, "currency", "KRW"),
  }
}