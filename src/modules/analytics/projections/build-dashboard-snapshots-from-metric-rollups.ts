import { createHash } from "node:crypto"
import type { AudienceMetricRollupRow } from "@/modules/analytics/repositories/audience-metric-rollup-repository"
import type { ContentMetricRollupRow } from "@/modules/analytics/repositories/content-metric-rollup-repository"
import type {
  AdminDashboardSnapshotRow,
  CreatorDashboardSnapshotRow,
} from "@/modules/analytics/repositories/dashboard-snapshot-repository"
import type { RevenueMetricRollupRow } from "@/modules/analytics/repositories/revenue-metric-rollup-repository"
import type { TrustSafetyMetricRollupRow } from "@/modules/analytics/repositories/trust-safety-metric-rollup-repository"

function hashSource(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex")
}

function sumRevenueRollups(rollups: RevenueMetricRollupRow[]) {
  return rollups.reduce(
    (acc, rollup) => {
      acc.grossRevenue += Number(rollup.gross_revenue ?? 0)
      acc.netRevenue += Number(rollup.net_revenue ?? 0)
      acc.platformFee += Number(rollup.platform_fee ?? 0)
      acc.refundAmount += Number(rollup.refund_amount ?? 0)
      return acc
    },
    {
      grossRevenue: 0,
      netRevenue: 0,
      platformFee: 0,
      refundAmount: 0,
    }
  )
}

function sumAudienceRollups(rollups: AudienceMetricRollupRow[]) {
  return rollups.reduce(
    (acc, rollup) => {
      acc.subscriberCount += Number(rollup.subscriber_count ?? 0)
      acc.activeSubscribers += Number(rollup.active_subscribers ?? 0)
      acc.newSubscribers += Number(rollup.new_subscribers ?? 0)
      acc.churnedSubscribers += Number(rollup.churned_subscribers ?? 0)
      return acc
    },
    {
      subscriberCount: 0,
      activeSubscribers: 0,
      newSubscribers: 0,
      churnedSubscribers: 0,
    }
  )
}

function sumContentRollups(rollups: ContentMetricRollupRow[]) {
  const totals = rollups.reduce(
    (acc, rollup) => {
      acc.views += Number(rollup.views ?? 0)
      acc.likes += Number(rollup.likes ?? 0)
      acc.comments += Number(rollup.comments ?? 0)
      acc.contentCount += rollup.content_id ? 1 : 0
      return acc
    },
    {
      views: 0,
      likes: 0,
      comments: 0,
      contentCount: 0,
      engagementRate: 0,
    }
  )

  totals.engagementRate =
    totals.views > 0
      ? ((totals.likes + totals.comments) / totals.views) * 100
      : 0

  return totals
}

function sumTrustSafetyRollups(rollups: TrustSafetyMetricRollupRow[]) {
  return rollups.reduce(
    (acc, rollup) => {
      acc.reportsReceived += Number(rollup.reports_received ?? 0)
      acc.casesReviewed += Number(rollup.cases_reviewed ?? 0)
      acc.actionsIssued += Number(rollup.actions_issued ?? 0)
      acc.contentRemoved += Number(rollup.content_removed ?? 0)
      acc.usersSuspended += Number(rollup.users_suspended ?? 0)
      return acc
    },
    {
      reportsReceived: 0,
      casesReviewed: 0,
      actionsIssued: 0,
      contentRemoved: 0,
      usersSuspended: 0,
    }
  )
}

function groupByCreator<T extends { creator_id: string | null }>(rollups: T[]) {
  const map = new Map<string, T[]>()

  for (const rollup of rollups) {
    if (!rollup.creator_id) continue

    const current = map.get(rollup.creator_id) ?? []
    current.push(rollup)
    map.set(rollup.creator_id, current)
  }

  return map
}

export function buildCreatorDashboardSnapshotsFromMetricRollups(input: {
  revenueRollups: RevenueMetricRollupRow[]
  audienceRollups?: AudienceMetricRollupRow[]
  contentRollups?: ContentMetricRollupRow[]
}): Array<Omit<CreatorDashboardSnapshotRow, "computed_at">> {
  const revenueByCreator = groupByCreator(input.revenueRollups)
  const audienceByCreator = groupByCreator(input.audienceRollups ?? [])
  const contentByCreator = groupByCreator(input.contentRollups ?? [])

  const creatorIds = new Set<string>([
    ...Array.from(revenueByCreator.keys()),
    ...Array.from(audienceByCreator.keys()),
    ...Array.from(contentByCreator.keys()),
  ])

  return Array.from(creatorIds).map((creatorId) => {
    const revenueRollups = revenueByCreator.get(creatorId) ?? []
    const audienceRollups = audienceByCreator.get(creatorId) ?? []
    const contentRollups = contentByCreator.get(creatorId) ?? []

    const metrics = {
      revenue: sumRevenueRollups(revenueRollups),
      audience: sumAudienceRollups(audienceRollups),
      content: sumContentRollups(contentRollups),
    }

    return {
      creator_id: creatorId,
      metrics,
      source_hash: hashSource({
        source: "metric_rollups",
        revenueRollupIds: revenueRollups.map((rollup) => rollup.rollup_id),
        audienceRollupIds: audienceRollups.map((rollup) => rollup.rollup_id),
        contentRollupIds: contentRollups.map((rollup) => rollup.rollup_id),
        metrics,
      }),
      projection_version: 2,
    }
  })
}

export function buildAdminDashboardSnapshotFromMetricRollups(input: {
  revenueRollups: RevenueMetricRollupRow[]
  audienceRollups?: AudienceMetricRollupRow[]
  contentRollups?: ContentMetricRollupRow[]
  trustSafetyRollups?: TrustSafetyMetricRollupRow[]
}): Omit<AdminDashboardSnapshotRow, "computed_at"> {
  const revenue = sumRevenueRollups(input.revenueRollups)
  const audience = sumAudienceRollups(input.audienceRollups ?? [])
  const content = sumContentRollups(input.contentRollups ?? [])
  const moderation = sumTrustSafetyRollups(input.trustSafetyRollups ?? [])

  const metrics = {
    revenue,
    audience,
    content,
    moderation,
    platform: {
      totalRevenue: revenue.grossRevenue,
      netRevenue: revenue.netRevenue,
      refundAmount: revenue.refundAmount,
      subscriberCount: audience.subscriberCount,
      activeSubscribers: audience.activeSubscribers,
      contentCount: content.contentCount,
      views: content.views,
      likes: content.likes,
      comments: content.comments,
      engagementRate: content.engagementRate,
      reportsReceived: moderation.reportsReceived,
      casesReviewed: moderation.casesReviewed,
      actionsIssued: moderation.actionsIssued,
      contentRemoved: moderation.contentRemoved,
      usersSuspended: moderation.usersSuspended,
    },
  }

  return {
    snapshot_key: "platform",
    metrics,
    source_hash: hashSource({
      source: "metric_rollups",
      revenueRollupIds: input.revenueRollups.map((rollup) => rollup.rollup_id),
      audienceRollupIds: (input.audienceRollups ?? []).map(
        (rollup) => rollup.rollup_id
      ),
      contentRollupIds: (input.contentRollups ?? []).map(
        (rollup) => rollup.rollup_id
      ),
      trustSafetyRollupIds: (input.trustSafetyRollups ?? []).map(
        (rollup) => rollup.rollup_id
      ),
      metrics,
    }),
    projection_version: 2,
  }
}