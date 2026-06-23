import type { CreatorAnalyticsSummary } from "@/modules/analytics/mappers/build-creator-analytics-summary"
import {
  formatCreatorAnalyticsSummaryMetricValue,
  getCreatorAnalyticsSummaryMetrics,
  type CreatorAnalyticsSummaryMetric,
  type CreatorAnalyticsSummaryMetricKey,
} from "@/modules/analytics/policies/creator-analytics-summary-metrics"

type DashboardStatsProps = {
  summary: CreatorAnalyticsSummary
}

type CreatorAnalyticsMetricCardsVariant = "dashboard" | "analyticsPage"

type CreatorAnalyticsMetricCardsProps = {
  metrics: CreatorAnalyticsSummaryMetric[]
  variant: CreatorAnalyticsMetricCardsVariant
}

const CREATOR_ANALYTICS_METRIC_CARD_STYLES: Record<
  CreatorAnalyticsMetricCardsVariant,
  {
    grid: string
    card: string
    label: string
    value: string
  }
> = {
  dashboard: {
    grid: "grid gap-4 sm:grid-cols-3",
    card: "border border-zinc-200 bg-white p-4 shadow-sm",
    label: "text-xs text-zinc-500",
    value: "mt-1 text-lg font-semibold text-zinc-900",
  },
  analyticsPage: {
    grid: "grid gap-4 md:grid-cols-2 xl:grid-cols-4",
    card: "rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5",
    label: "text-sm uppercase tracking-[0.2em] text-zinc-500",
    value: "mt-4 text-3xl font-semibold text-white",
  },
}

const DASHBOARD_STATS_METRICS: CreatorAnalyticsSummaryMetricKey[] = [
  "subscribers",
  "activeSubscriptions",
  "monthlyRevenue",
]

export function CreatorAnalyticsMetricCards({
  metrics,
  variant,
}: CreatorAnalyticsMetricCardsProps) {
  const styles = CREATOR_ANALYTICS_METRIC_CARD_STYLES[variant]

  return (
    <section className={styles.grid}>
      {metrics.map((metric) => (
        <div key={metric.id} className={styles.card}>
          <p className={styles.label}>{metric.label}</p>
          <p className={styles.value}>
            {formatCreatorAnalyticsSummaryMetricValue(metric)}
          </p>
        </div>
      ))}
    </section>
  )
}

export function DashboardStats({ summary }: DashboardStatsProps) {
  const metrics = getCreatorAnalyticsSummaryMetrics(
    summary,
    DASHBOARD_STATS_METRICS
  )

  return <CreatorAnalyticsMetricCards metrics={metrics} variant="dashboard" />
}
