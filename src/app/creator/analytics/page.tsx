import { redirect } from "next/navigation"
import { canAccessCreatorAnalytics } from "@/modules/authorization/public"
import { buildPathWithNext } from "@/modules/auth/utils/redirect-handoff"
import { CREATOR_ANALYTICS_PERIOD } from "@/modules/analytics/public/creator-analytics-period"
import { readCreatorDashboard } from "@/modules/analytics/public/read-creator-dashboard"
import { requireCreatorReadyUser } from "@/modules/creator/public/require-creator-ready-user"
import { readCreatorOperationalReadiness } from "@/modules/creator/public/read-creator-operational-readiness"

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function formatCurrency(value: number): string {
  return `₩${value.toLocaleString()}`
}

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

  const analyticsPermission = await canAccessCreatorAnalytics({
    actorId: user.id,
    creatorId: readiness.creator.id,
  })

  if (!analyticsPermission.allowed) {
    redirect(
      buildPathWithNext({
        path: "/dashboard",
        next: nextPath,
      })
    )
  }

  const analytics = await readCreatorDashboard(readiness.creator.id)

  if (!analytics) {
    redirect(
      buildPathWithNext({
        path: "/dashboard",
        next: nextPath,
      })
    )
  }

  const metrics = [
    {
      id: "totalRevenue",
      label: "Total revenue",
      value: formatCurrency(readNumber(analytics.revenue.totalRevenue)),
    },
    {
      id: "subscribers",
      label: "Subscribers",
      value: readNumber(analytics.audience.subscriberCount).toLocaleString(),
    },
    {
      id: "posts",
      label: "Posts",
      value: readNumber(analytics.content.posts).toLocaleString(),
    },
    {
      id: "engagement",
      label: "Engagement",
      value: `${readNumber(analytics.content.engagementRate).toLocaleString()}%`,
    },
  ]

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
              {CREATOR_ANALYTICS_PERIOD.label}
            </div>
            <button
              type="button"
              className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900"
            >
              Filter period
            </button>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          {metrics.map((metric) => (
            <article
              key={metric.id}
              className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6"
            >
              <p className="text-sm text-zinc-500">{metric.label}</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                {metric.value}
              </p>
            </article>
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
