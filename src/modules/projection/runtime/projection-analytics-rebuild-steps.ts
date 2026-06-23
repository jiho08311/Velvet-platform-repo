import {
  rebuildAnalyticsRollups,
  rebuildAudienceRollups,
  rebuildContentRollups,
  rebuildDashboardSnapshots,
  rebuildDashboardSnapshotsFromMetricRollups,
  rebuildModerationRollups,
  rebuildRevenueRollups,
} from "@/modules/analytics/public/rebuild-analytics-projections"
import type { RebuildStep } from "./projection-rebuild-step-registry"

export function createAnalyticsProjectionRebuildSteps(input: {
  dryRun: boolean
  limit: number
}): RebuildStep[] {
  const { dryRun, limit } = input

  return [
    {
      name: "analytics_rollups",
      run: () => rebuildAnalyticsRollups({ dryRun, limit }),
    },
    {
      name: "dashboard_snapshots",
      run: () => rebuildDashboardSnapshots({ dryRun, limit }),
    },
    {
      name: "revenue_metric_rollups",
      run: () => rebuildRevenueRollups({ dryRun, limit }),
    },
    {
      name: "audience_metric_rollups",
      run: () => rebuildAudienceRollups({ dryRun, limit }),
    },
    {
      name: "content_metric_rollups",
      run: () => rebuildContentRollups({ dryRun, limit }),
    },
    {
      name: "trust_safety_metric_rollups",
      run: () => rebuildModerationRollups({ dryRun, limit }),
    },
    {
      name: "dashboard_snapshots_metric_rollups",
      run: () =>
        rebuildDashboardSnapshotsFromMetricRollups({
          dryRun,
          limit,
        }),
    },
  ]
}
