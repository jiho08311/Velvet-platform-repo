import { readAdminDashboardSnapshot } from "@/modules/analytics/repositories/dashboard-snapshot-repository"

export const PUBLIC_CONTRACT = true

export type AdminDashboardReadModel = {
  snapshotVersion: number
  generatedAt: string
  revenue: Record<string, unknown>
  moderation: Record<string, unknown>
  platform: Record<string, unknown>
}

function readObject(metrics: Record<string, unknown>, key: string) {
  const value = metrics[key]
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

export async function readAdminDashboard(
  snapshotKey = "platform"
): Promise<AdminDashboardReadModel | null> {
  const snapshot = await readAdminDashboardSnapshot(snapshotKey)

  if (!snapshot) {
    return null
  }

  return {
    snapshotVersion: snapshot.projection_version,
    generatedAt: snapshot.computed_at,
    revenue: readObject(snapshot.metrics, "revenue"),
    moderation: readObject(snapshot.metrics, "moderation"),
    platform: readObject(snapshot.metrics, "platform"),
  }
}
