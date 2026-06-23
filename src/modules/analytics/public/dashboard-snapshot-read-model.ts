import {
  readAdminDashboardSnapshot as readAdminDashboardSnapshotRepository,
  readCreatorDashboardSnapshot as readCreatorDashboardSnapshotRepository,
} from "@/modules/analytics/repositories/dashboard-snapshot-repository"

export const PUBLIC_CONTRACT = true

export type AdminDashboardSnapshotRow = NonNullable<
  Awaited<ReturnType<typeof readAdminDashboardSnapshotRepository>>
>
export type CreatorDashboardSnapshotRow = NonNullable<
  Awaited<ReturnType<typeof readCreatorDashboardSnapshotRepository>>
>

export function readAdminDashboardSnapshot(
  snapshotKey: string
): ReturnType<typeof readAdminDashboardSnapshotRepository> {
  return readAdminDashboardSnapshotRepository(snapshotKey)
}

export function readCreatorDashboardSnapshot(
  creatorId: string
): ReturnType<typeof readCreatorDashboardSnapshotRepository> {
  return readCreatorDashboardSnapshotRepository(creatorId)
}
