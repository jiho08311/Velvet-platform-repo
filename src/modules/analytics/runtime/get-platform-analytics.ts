import { readAdminDashboardSnapshot } from "@/modules/analytics/repositories/dashboard-snapshot-repository"

type PlatformAnalytics = {
  userCount: number
  creatorCount: number
  postCount: number
  totalRevenue: number
}

function readNumber(metrics: Record<string, unknown>, key: string): number {
  const value = metrics[key]
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

export async function getPlatformAnalytics(): Promise<PlatformAnalytics> {
  const snapshot = await readAdminDashboardSnapshot("platform")

  if (!snapshot) {
    return {
      userCount: 0,
      creatorCount: 0,
      postCount: 0,
      totalRevenue: 0,
    }
  }

  return {
    userCount: readNumber(snapshot.metrics, "userCount"),
    creatorCount: readNumber(snapshot.metrics, "creatorCount"),
    postCount: readNumber(snapshot.metrics, "postCount"),
    totalRevenue: readNumber(snapshot.metrics, "totalRevenue"),
  }
}