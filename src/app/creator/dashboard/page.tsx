import { getCreatorAnalyticsSummary } from "@/modules/analytics/server/get-creator-analytics"
import { requireCreatorReadyUser } from "@/modules/creator/server/require-creator-ready-user"
import { DashboardStats } from "@/modules/analytics/ui/DashboardStats"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value)
}

export default async function CreatorDashboardPage() {
  const { creator } = await requireCreatorReadyUser({
    signInNext: "/creator/dashboard",
  })

  const summary = await getCreatorAnalyticsSummary(creator.id)

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
        <article className="rounded-2xl border border-white/10 bg-neutral-950 p-5">
          <p className="text-sm text-white/60">Total posts</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
            {summary.counts.postCount}
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-neutral-950 p-5">
          <p className="text-sm text-white/60">Total revenue</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
            {formatCurrency(summary.revenue.totalRevenue)}
          </p>
        </article>
      </section>
    </main>
  )
}
