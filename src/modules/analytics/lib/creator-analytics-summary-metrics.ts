import type { CreatorAnalyticsSummary } from "@/modules/analytics/server/build-creator-analytics-summary"

type CreatorAnalyticsSummaryMetricValue = number | string

type CreatorAnalyticsSummaryMetricValueKind = "count" | "currency" | "text"

type CreatorAnalyticsSummaryMetricDefinition = {
  id: string
  label: string
  valueKind: CreatorAnalyticsSummaryMetricValueKind
  getValue: (
    summary: CreatorAnalyticsSummary
  ) => CreatorAnalyticsSummaryMetricValue
}

export const CREATOR_ANALYTICS_SUMMARY_METRICS = {
  subscribers: {
    id: "subscribers",
    label: "Subscribers",
    valueKind: "count",
    getValue: (summary) => summary.counts.subscriberCount,
  },
  activeSubscriptions: {
    id: "active-subscriptions",
    label: "Active Subscriptions",
    valueKind: "count",
    getValue: (summary) => summary.counts.activeSubscriptionCount,
  },
  monthlyRevenue: {
    id: "monthly-revenue",
    label: "Monthly Revenue",
    valueKind: "currency",
    getValue: (summary) => summary.revenue.monthlyRevenue,
  },
  posts: {
    id: "posts",
    label: "Posts",
    valueKind: "count",
    getValue: (summary) => summary.counts.postCount,
  },
  totalRevenue: {
    id: "total-revenue",
    label: "Total Revenue",
    valueKind: "currency",
    getValue: (summary) => summary.revenue.totalRevenue,
  },
  grossRevenue: {
    id: "gross-revenue",
    label: "Gross Revenue",
    valueKind: "currency",
    getValue: (summary) => summary.revenue.grossRevenue,
  },
  netRevenue: {
    id: "net-revenue",
    label: "Net Revenue",
    valueKind: "currency",
    getValue: (summary) => summary.revenue.netRevenue,
  },
  fees: {
    id: "fees",
    label: "Fees",
    valueKind: "currency",
    getValue: (summary) => summary.revenue.fees,
  },
  engagement: {
    id: "engagement",
    label: "Engagement",
    valueKind: "text",
    getValue: (summary) => summary.engagement.label,
  },
} as const satisfies Record<string, CreatorAnalyticsSummaryMetricDefinition>

export type CreatorAnalyticsSummaryMetricKey =
  keyof typeof CREATOR_ANALYTICS_SUMMARY_METRICS

export type CreatorAnalyticsSummaryMetric = {
  id: string
  label: string
  valueKind: CreatorAnalyticsSummaryMetricValueKind
  value: CreatorAnalyticsSummaryMetricValue
}

export function getCreatorAnalyticsSummaryMetric(
  summary: CreatorAnalyticsSummary,
  key: CreatorAnalyticsSummaryMetricKey
): CreatorAnalyticsSummaryMetric {
  const definition = CREATOR_ANALYTICS_SUMMARY_METRICS[key]

  return {
    id: definition.id,
    label: definition.label,
    valueKind: definition.valueKind,
    value: definition.getValue(summary),
  }
}

export function getCreatorAnalyticsSummaryMetrics(
  summary: CreatorAnalyticsSummary,
  keys: readonly CreatorAnalyticsSummaryMetricKey[]
) {
  return keys.map((key) => getCreatorAnalyticsSummaryMetric(summary, key))
}
