import { getSession } from "@/modules/auth/server/get-session"
import { getCreatorOverview } from "@/modules/analytics/server/get-creator-overview"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { getUserById } from "@/modules/user/server/get-user-by-id"

export default async function CreatorDashboardPage() {
  const session = await getSession()

  if (!session) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
        <section className="rounded-2xl border border-white/10 bg-neutral-950 p-8 text-center text-sm text-white/60">
          Sign in to view your dashboard.
        </section>
      </main>
    )
  }

  const user = await getUserById(session.userId)

  if (!user) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
        <section className="rounded-2xl border border-white/10 bg-neutral-950 p-8 text-center text-sm text-white/60">
          Creator access is required to view this page.
        </section>
      </main>
    )
  }

  const creator = await getCreatorByUserId(user.id)

  if (!creator) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
        <section className="rounded-2xl border border-white/10 bg-neutral-950 p-8 text-center text-sm text-white/60">
          Creator access is required to view this page.
        </section>
      </main>
    )
  }

  const overview = await getCreatorOverview(session.userId)

  if (!overview) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
        <section className="rounded-2xl border border-white/10 bg-neutral-950 p-8 text-center text-sm text-white/60">
          Unable to load dashboard overview.
        </section>
      </main>
    )
  }

  const cards = [
    { label: "Total posts", value: overview.totalPosts },
    { label: "Active subscribers", value: overview.activeSubscribers },
    { label: "Monthly revenue", value: `$${overview.monthlyRevenue}` },
    { label: "Total revenue", value: `$${overview.totalRevenue}` },
  ]

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <section>
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-white/60">
          Overview of your creator account performance.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-white/10 bg-neutral-950 p-5"
          >
            <p className="text-sm text-white/60">{card.label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
              {card.value}
            </p>
          </article>
        ))}
      </section>
    </main>
  )
}