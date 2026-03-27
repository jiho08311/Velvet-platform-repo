import { redirect } from "next/navigation"

import { getSession } from "@/modules/auth/server/get-session"
import { getCreatorAnalytics } from "@/modules/analytics/server/get-creator-analytics"

type AnalyticsSummaryView = {
  revenue: string
  subscribersCount: number
  postsCount: number
  engagementLabel: string
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value)
}

function getSessionUserId(session: unknown) {
  if (!session || typeof session !== "object") {
    return null
  }

  if ("userId" in session && typeof session.userId === "string") {
    return session.userId
  }

  if (
    "user" in session &&
    session.user &&
    typeof session.user === "object" &&
    "id" in session.user &&
    typeof session.user.id === "string"
  ) {
    return session.user.id
  }

  return null
}

function normalizeAnalyticsSummary(data: unknown): AnalyticsSummaryView | null {
  if (!data || typeof data !== "object") {
    return null
  }

  const source = data as {
    revenue?: string
    revenueLabel?: string
    revenueAmount?: number
    subscribersCount?: number
    subscriberCount?: number
    postsCount?: number
    postCount?: number
    engagementLabel?: string
    engagementRate?: number
  }

  const revenue =
    typeof source.revenue === "string"
      ? source.revenue
      : typeof source.revenueLabel === "string"
        ? source.revenueLabel
        : typeof source.revenueAmount === "number"
          ? formatCurrency(source.revenueAmount)
          : "$0"

  const subscribersCount =
    typeof source.subscribersCount === "number"
      ? source.subscribersCount
      : typeof source.subscriberCount === "number"
        ? source.subscriberCount
        : 0

  const postsCount =
    typeof source.postsCount === "number"
      ? source.postsCount
      : typeof source.postCount === "number"
        ? source.postCount
        : 0

  const engagementLabel =
    typeof source.engagementLabel === "string"
      ? source.engagementLabel
      : typeof source.engagementRate === "number"
        ? `${source.engagementRate}% avg engagement`
        : "No engagement data"

  return {
    revenue,
    subscribersCount,
    postsCount,
    engagementLabel,
  }
}

export default async function CreatorAnalyticsPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const userId = getSessionUserId(session)

  if (!userId) {
    redirect("/login")
  }

  const analyticsData = await getCreatorAnalytics(userId)
  const analytics = normalizeAnalyticsSummary(analyticsData)

  if (!analytics) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <section className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 p-12 text-center">
            <h1 className="text-2xl font-semibold text-white">
              No analytics yet
            </h1>
            <p className="mt-3 text-sm text-zinc-400">
              Creator analytics will appear here once data is available.
            </p>
          </section>
        </div>
      </main>
    )
  }

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
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
              Revenue
            </p>
            <p className="mt-4 text-3xl font-semibold text-white">
              {analytics.revenue}
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
              Subscribers
            </p>
            <p className="mt-4 text-3xl font-semibold text-white">
              {analytics.subscribersCount}
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
              Posts
            </p>
            <p className="mt-4 text-3xl font-semibold text-white">
              {analytics.postsCount}
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
              Engagement
            </p>
            <p className="mt-4 text-3xl font-semibold text-white">
              {analytics.engagementLabel}
            </p>
          </div>
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