import { notFound } from "next/navigation"
import { readCreatorDashboard } from "@/modules/analytics/public/read-creator-dashboard"
import { requireCreatorReadyUser } from "@/modules/creator/public/require-creator-ready-user"

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

export default async function CreatorDashboardPage() {
  const { creator } = await requireCreatorReadyUser({
    signInNext: "/creator/dashboard",
  })

  const analytics = await readCreatorDashboard(creator.id)

  if (!analytics) {
    notFound()
  }

  const postCount = readNumber(analytics.content.posts)
  const totalRevenue = readNumber(analytics.revenue.totalRevenue)

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <section>
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-white/60">
          Overview of your creator account performance.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-neutral-950 p-5">
          <p className="text-sm text-white/60">Posts</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
            {postCount.toLocaleString()}
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-neutral-950 p-5">
          <p className="text-sm text-white/60">Total revenue</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
            ₩{totalRevenue.toLocaleString()}
          </p>
        </article>
      </section>
    </main>
  )
}