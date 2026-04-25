import { redirect } from "next/navigation"

import { buildPathWithNext } from "@/modules/auth/lib/redirect-handoff"
import {
  formatCreatorAnalyticsSummaryMetricValue,
  getCreatorAnalyticsSummaryMetrics,
  type CreatorAnalyticsSummaryMetricKey,
} from "@/modules/analytics/lib/creator-analytics-summary-metrics"
import { getCreatorAnalyticsSummary } from "@/modules/analytics/server/get-creator-analytics"
import { requireCreatorReadyUser } from "@/modules/creator/server/require-creator-ready-user"
import { readCreatorOperationalReadiness } from "@/modules/creator/server/read-creator-operational-readiness"

const CREATOR_ANALYTICS_PAGE_METRICS: CreatorAnalyticsSummaryMetricKey[] = [
  "totalRevenue",
  "subscribers",
  "posts",
  "engagement",
]

export default async function CreatorAnalyticsPage() {
  const nextPath = "/creator/analytics"
  const { user } = await requireCreatorReadyUser({
    signInNext: nextPath,
  })
  const readiness = await readCreatorOperationalReadiness({
    userId: user.id,
  })

  if (!readiness.ok) {
    redirect(
      buildPathWithNext({
        path: "/dashboard",
        next: nextPath,
      })
    )
  }

  const analytics = await getCreatorAnalyticsSummary(readiness.creator.id)
  const metrics = getCreatorAnalyticsSummaryMetrics(
    analytics,
    CREATOR_ANALYTICS_PAGE_METRICS
  )

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
              Creator
            </p>
            <h1 className="text-3xl font-semibold text-white">Analytics</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Review your creator performance and revenue signals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-zinc-800 bg-zinc-900/70 px-4 py-2 text-sm text-zinc-300">
              Last 30 days
            </div>
            <button
              type="button"
              className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900"
            >
              Filter period
            </button>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.id}
              className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5"
            >
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                {metric.label}
              </p>
              <p className="mt-4 text-3xl font-semibold text-white">
                {formatCreatorAnalyticsSummaryMetricValue(metric)}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                  Chart
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  Revenue and engagement overview
                </h2>
              </div>
            </div>

            <div className="mt-6 flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 text-sm text-zinc-500">
              Analytics chart placeholder
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
              Highlights
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-sm font-medium text-white">
                  Strong subscriber retention
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Your current subscriber base is stable and trending upward.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-sm font-medium text-white">
                  Posting cadence placeholder
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Add future posting insights or performance comparisons here.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-sm font-medium text-white">
                  Top content placeholder
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Reserve this area for top-performing posts or media insights.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
