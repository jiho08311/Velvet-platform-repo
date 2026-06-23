import { readCreatorDashboardSnapshot } from "@/modules/analytics/repositories/dashboard-snapshot-repository"

export const PUBLIC_CONTRACT = true

export type CreatorDashboardReadModel = {
  snapshotVersion: number
  generatedAt: string
  revenue: Record<string, unknown>
  audience: Record<string, unknown>
  content: Record<string, unknown>
}

function readObject(metrics: Record<string, unknown>, key: string) {
  const value = metrics[key]
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

export async function readCreatorDashboard(
  creatorId: string
): Promise<CreatorDashboardReadModel | null> {
  const snapshot = await readCreatorDashboardSnapshot(creatorId)

  if (!snapshot) {
    return null
  }

  return {
    snapshotVersion: snapshot.projection_version,
    generatedAt: snapshot.computed_at,
    revenue: readObject(snapshot.metrics, "revenue"),
    audience: readObject(snapshot.metrics, "audience"),
    content: readObject(snapshot.metrics, "content"),
  }
}
