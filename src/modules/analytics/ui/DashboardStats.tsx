import type { CreatorAnalyticsSummary } from "@/modules/analytics/server/build-creator-analytics-summary"
import {
  formatCreatorAnalyticsSummaryMetricValue,
  getCreatorAnalyticsSummaryMetrics,
  type CreatorAnalyticsSummaryMetricKey,
} from "@/modules/analytics/lib/creator-analytics-summary-metrics"

type DashboardStatsProps = {
  summary: CreatorAnalyticsSummary
}

const DASHBOARD_STATS_METRICS: CreatorAnalyticsSummaryMetricKey[] = [
  "subscribers",
  "activeSubscriptions",
  "monthlyRevenue",
]

export function DashboardStats({ summary }: DashboardStatsProps) {
  const metrics = getCreatorAnalyticsSummaryMetrics(
    summary,
    DASHBOARD_STATS_METRICS
  )

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className="border border-zinc-200 bg-white p-4 shadow-sm"
        >
          <p className="text-xs text-zinc-500">{metric.label}</p>
          <p className="mt-1 text-lg font-semibold text-zinc-900">
            {formatCreatorAnalyticsSummaryMetricValue(metric)}
          </p>
        </div>
      ))}
    </section>
  )
}
