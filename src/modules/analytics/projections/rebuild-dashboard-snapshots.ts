import { listAnalyticsRollups } from "@/modules/analytics/repositories/analytics-rollup-repository"
import {
  upsertAdminDashboardSnapshot,
  upsertCreatorDashboardSnapshot,
} from "@/modules/analytics/repositories/dashboard-snapshot-repository"
import {
  buildAdminDashboardSnapshot,
  buildCreatorDashboardSnapshots,
} from "./build-dashboard-snapshots"

export async function rebuildDashboardSnapshots(input?: {
  dryRun?: boolean
  limit?: number
}) {
  const limit = Math.max(1, Math.min(input?.limit ?? 5000, 10000))

  const [creatorRollups, platformRollups] = await Promise.all([
    listAnalyticsRollups({
      rollupType: "lifetime",
      subjectType: "creator",
      limit,
    }),
    listAnalyticsRollups({
      rollupType: "daily",
      subjectType: "platform",
      limit,
    }),
  ])

  const creatorSnapshots = buildCreatorDashboardSnapshots(creatorRollups)
  const adminSnapshot = buildAdminDashboardSnapshot(platformRollups)

  let upsertedCreatorCount = 0
  let failedCreatorCount = 0
  let upsertedAdminCount = 0
  let failedAdminCount = 0

  for (const snapshot of creatorSnapshots) {
    try {
      if (!input?.dryRun) {
        const { error } = await upsertCreatorDashboardSnapshot(snapshot)
        if (error) throw error
      }

      upsertedCreatorCount += 1
    } catch {
      failedCreatorCount += 1
    }
  }

  try {
    if (!input?.dryRun) {
      const { error } = await upsertAdminDashboardSnapshot(adminSnapshot)
      if (error) throw error
    }

    upsertedAdminCount += 1
  } catch {
    failedAdminCount += 1
  }

  return {
    scannedCreatorRollupCount: creatorRollups.length,
    scannedPlatformRollupCount: platformRollups.length,
    creatorSnapshotCount: creatorSnapshots.length,
    adminSnapshotCount: 1,
    upsertedCreatorCount,
    failedCreatorCount,
    upsertedAdminCount,
    failedAdminCount,
  }
}
