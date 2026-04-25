import { getCreatorAnalyticsSummary } from "@/modules/analytics/server/get-creator-analytics"
import { requireCreatorReadyUser } from "@/modules/creator/server/require-creator-ready-user"
import { DashboardStats } from "@/modules/analytics/ui/DashboardStats"
import {
  formatCreatorAnalyticsSummaryMetricValue,
  getCreatorAnalyticsSummaryMetrics,
  type CreatorAnalyticsSummaryMetricKey,
} from "@/modules/analytics/lib/creator-analytics-summary-metrics"

const CREATOR_DASHBOARD_EXTRA_METRICS: CreatorAnalyticsSummaryMetricKey[] = [
  "posts",
  "totalRevenue",
]

export default async function CreatorDashboardPage() {
  const { creator } = await requireCreatorReadyUser({
    signInNext: "/creator/dashboard",
  })

  const summary = await getCreatorAnalyticsSummary(creator.id)
  const extraMetrics = getCreatorAnalyticsSummaryMetrics(
    summary,
    CREATOR_DASHBOARD_EXTRA_METRICS
  )

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <section>
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-white/60">
          Overview of your creator account performance.
        </p>
      </section>

      <DashboardStats summary={summary} />

      <section className="grid gap-4 sm:grid-cols-2">
        {extraMetrics.map((metric) => (
          <article
            key={metric.id}
            className="rounded-2xl border border-white/10 bg-neutral-950 p-5"
          >
            <p className="text-sm text-white/60">{metric.label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
              {formatCreatorAnalyticsSummaryMetricValue(metric)}
            </p>
          </article>
        ))}
      </section>
    </main>
  )
}
