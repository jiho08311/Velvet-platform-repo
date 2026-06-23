import { listAudienceMetricRollups } from "@/modules/analytics/repositories/audience-metric-rollup-repository"
import { listContentMetricRollups } from "@/modules/analytics/repositories/content-metric-rollup-repository"
import { listRevenueMetricRollups } from "@/modules/analytics/repositories/revenue-metric-rollup-repository"
import { listTrustSafetyMetricRollups } from "@/modules/analytics/repositories/trust-safety-metric-rollup-repository"
import {
  upsertAdminDashboardSnapshot,
  upsertCreatorDashboardSnapshot,
} from "@/modules/analytics/repositories/dashboard-snapshot-repository"
import {
  buildAdminDashboardSnapshotFromMetricRollups,
  buildCreatorDashboardSnapshotsFromMetricRollups,
} from "@/modules/analytics/projections/build-dashboard-snapshots-from-metric-rollups"

export async function rebuildDashboardSnapshotsFromMetricRollups(input?: {
  dryRun?: boolean
  limit?: number
}) {
  const limit = Math.max(1, Math.min(input?.limit ?? 5000, 10000))

  const [
    revenueRollups,
    audienceRollups,
    contentRollups,
    trustSafetyRollups,
  ] = await Promise.all([
    listRevenueMetricRollups({ limit }),
    listAudienceMetricRollups({ limit }),
    listContentMetricRollups({ limit }),
    listTrustSafetyMetricRollups({ limit }),
  ])

  const creatorSnapshots = buildCreatorDashboardSnapshotsFromMetricRollups({
    revenueRollups,
    audienceRollups,
    contentRollups,
  })

  const adminSnapshot = buildAdminDashboardSnapshotFromMetricRollups({
    revenueRollups,
    audienceRollups,
    contentRollups,
    trustSafetyRollups,
  })

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
    scannedRevenueRollupCount: revenueRollups.length,
    scannedAudienceRollupCount: audienceRollups.length,
    scannedContentRollupCount: contentRollups.length,
    scannedTrustSafetyRollupCount: trustSafetyRollups.length,
    creatorSnapshotCount: creatorSnapshots.length,
    adminSnapshotCount: 1,
    upsertedCreatorCount,
    failedCreatorCount,
    upsertedAdminCount,
    failedAdminCount,
  }
}

export async function rebuildCreatorDashboardSnapshotFromMetricRollups(input: {
  creatorId: string
  dryRun?: boolean
  limit?: number
}) {
  const limit = Math.max(1, Math.min(input.limit ?? 5000, 10000))

  const [revenueRollups, audienceRollups, contentRollups] = await Promise.all([
    listRevenueMetricRollups({
      creatorId: input.creatorId,
      limit,
    }),
    listAudienceMetricRollups({
      creatorId: input.creatorId,
      limit,
    }),
    listContentMetricRollups({
      creatorId: input.creatorId,
      limit,
    }),
  ])

  const [creatorSnapshot] = buildCreatorDashboardSnapshotsFromMetricRollups({
    revenueRollups,
    audienceRollups,
    contentRollups,
  })

  if (!creatorSnapshot) {
    return {
      creatorId: input.creatorId,
      scannedRevenueRollupCount: revenueRollups.length,
      scannedAudienceRollupCount: audienceRollups.length,
      scannedContentRollupCount: contentRollups.length,
      creatorSnapshotCount: 0,
      upsertedCreatorCount: 0,
      failedCreatorCount: 0,
    }
  }

  try {
    if (!input.dryRun) {
      const { error } = await upsertCreatorDashboardSnapshot(creatorSnapshot)
      if (error) throw error
    }

    return {
      creatorId: input.creatorId,
      scannedRevenueRollupCount: revenueRollups.length,
      scannedAudienceRollupCount: audienceRollups.length,
      scannedContentRollupCount: contentRollups.length,
      creatorSnapshotCount: 1,
      upsertedCreatorCount: 1,
      failedCreatorCount: 0,
    }
  } catch {
    return {
      creatorId: input.creatorId,
      scannedRevenueRollupCount: revenueRollups.length,
      scannedAudienceRollupCount: audienceRollups.length,
      scannedContentRollupCount: contentRollups.length,
      creatorSnapshotCount: 1,
      upsertedCreatorCount: 0,
      failedCreatorCount: 1,
    }
  }
}