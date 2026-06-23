import { createHash } from "node:crypto"
import type { AnalyticsRollupRow } from "@/modules/analytics/repositories/analytics-rollup-repository"
import type {
  AdminDashboardSnapshotRow,
  CreatorDashboardSnapshotRow,
} from "@/modules/analytics/repositories/dashboard-snapshot-repository"

function hashSource(value: unknown) {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")
}

function numberMetric(
  metrics: Record<string, unknown>,
  key: string
): number {
  const value = metrics[key]

  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

export function buildCreatorDashboardSnapshots(
  rollups: AnalyticsRollupRow[]
): Array<Omit<CreatorDashboardSnapshotRow, "computed_at">> {
  return rollups
    .filter((rollup) => rollup.rollup_type === "lifetime")
    .filter((rollup) => rollup.subject_type === "creator")
    .filter((rollup) => typeof rollup.subject_id === "string")
    .map((rollup) => {
      const metrics = {
        paymentCount: numberMetric(rollup.metrics, "payment_count"),
        succeededPaymentCount: numberMetric(
          rollup.metrics,
          "succeeded_payment_count"
        ),
        totalRevenue: numberMetric(
          rollup.metrics,
          "succeeded_payment_amount"
        ),
        subscriptionCount: numberMetric(rollup.metrics, "subscription_count"),
        activeSubscriptionCount: numberMetric(
          rollup.metrics,
          "active_subscription_count"
        ),
        contentCount: numberMetric(rollup.metrics, "content_count"),
        publishedContentCount: numberMetric(
          rollup.metrics,
          "published_content_count"
        ),
        feedVisibleContentCount: numberMetric(
          rollup.metrics,
          "feed_visible_content_count"
        ),
      }

      return {
        creator_id: rollup.subject_id!,
        metrics,
        source_hash: hashSource({ rollupKey: rollup.rollup_key, metrics }),
        projection_version: 1,
      }
    })
}

export function buildAdminDashboardSnapshot(
  rollups: AnalyticsRollupRow[]
): Omit<AdminDashboardSnapshotRow, "computed_at"> {
  const dailyPlatformRollups = rollups
    .filter((rollup) => rollup.rollup_type === "daily")
    .filter((rollup) => rollup.subject_type === "platform")

  const metrics = dailyPlatformRollups.reduce(
    (acc, rollup) => {
      acc.paymentCount += numberMetric(rollup.metrics, "payment_count")
      acc.succeededPaymentCount += numberMetric(
        rollup.metrics,
        "succeeded_payment_count"
      )
      acc.totalRevenue += numberMetric(
        rollup.metrics,
        "succeeded_payment_amount"
      )
      acc.subscriptionCount += numberMetric(
        rollup.metrics,
        "subscription_count"
      )
      acc.activeSubscriptionCount += numberMetric(
        rollup.metrics,
        "active_subscription_count"
      )
      acc.contentCount += numberMetric(rollup.metrics, "content_count")
      acc.publishedContentCount += numberMetric(
        rollup.metrics,
        "published_content_count"
      )
      acc.feedVisibleContentCount += numberMetric(
        rollup.metrics,
        "feed_visible_content_count"
      )

      return acc
    },
    {
      paymentCount: 0,
      succeededPaymentCount: 0,
      totalRevenue: 0,
      subscriptionCount: 0,
      activeSubscriptionCount: 0,
      contentCount: 0,
      publishedContentCount: 0,
      feedVisibleContentCount: 0,
    }
  )

  return {
    snapshot_key: "platform",
    metrics,
    source_hash: hashSource({
      rollupKeys: dailyPlatformRollups.map((rollup) => rollup.rollup_key),
      metrics,
    }),
    projection_version: 1,
  }
}
