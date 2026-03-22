import { getAdminAnalytics } from "@/modules/analytics/server/get-admin-analytics"

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export default async function AdminAnalyticsPage() {
  const summary = await getAdminAnalytics()

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
              Admin
            </p>
            <h1 className="text-3xl font-semibold text-white">Analytics</h1>
            <p className="text-sm text-zinc-400">
              Review platform-wide performance signals and trend placeholders.
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
              Total users
            </p>
            <p className="mt-4 text-3xl font-semibold text-white">
              {formatNumber(summary.totalUsers)}
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
              Total revenue
            </p>
            <p className="mt-4 text-3xl font-semibold text-white">
              {formatCurrency(summary.totalRevenue, summary.currency ?? "USD")}
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
              Active creators
            </p>
            <p className="mt-4 text-3xl font-semibold text-white">
              {formatNumber(summary.activeCreators)}
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
              Open reports
            </p>
            <p className="mt-4 text-3xl font-semibold text-white">
              {formatNumber(summary.openReports)}
            </p>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
              Charts
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Revenue trend and users growth
            </h2>

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
                <p className="text-sm font-medium text-white">Users growth</p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Reserve this area for user acquisition and growth insights.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-sm font-medium text-white">Creator activity</p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Add creator engagement, posting cadence, or activity metrics here.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-sm font-medium text-white">Reports trend</p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Use this block for moderation volume and reporting trends.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-sm font-medium text-white">Revenue trend</p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Placeholder for recurring revenue and payment movement analysis.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}