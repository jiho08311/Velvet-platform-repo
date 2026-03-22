import Link from "next/link"

export default async function AdminDashboardPage() {
  const summary = {
    usersCount: 0,
    creatorsCount: 0,
    reportsCount: 0,
    revenue: 0,
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 text-white">
      <section className="rounded-2xl border border-white/10 bg-neutral-950 p-6">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-white/60">
          Overview of platform health and activity.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-neutral-950 p-5">
          <p className="text-sm text-white/50">Users</p>
          <p className="mt-2 text-2xl font-semibold">{summary.usersCount}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-950 p-5">
          <p className="text-sm text-white/50">Creators</p>
          <p className="mt-2 text-2xl font-semibold">{summary.creatorsCount}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-950 p-5">
          <p className="text-sm text-white/50">Reports</p>
          <p className="mt-2 text-2xl font-semibold">{summary.reportsCount}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-950 p-5">
          <p className="text-sm text-white/50">Revenue</p>
          <p className="mt-2 text-2xl font-semibold">${summary.revenue}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link
          href="/admin/users"
          className="rounded-2xl border border-white/10 bg-neutral-950 p-5 transition hover:bg-white/5"
        >
          <h2 className="text-lg font-semibold">Users</h2>
          <p className="mt-1 text-sm text-white/60">
            Manage platform users
          </p>
        </Link>

        <Link
          href="/admin/creators"
          className="rounded-2xl border border-white/10 bg-neutral-950 p-5 transition hover:bg-white/5"
        >
          <h2 className="text-lg font-semibold">Creators</h2>
          <p className="mt-1 text-sm text-white/60">
            Review creator accounts
          </p>
        </Link>

        <Link
          href="/admin/reports"
          className="rounded-2xl border border-white/10 bg-neutral-950 p-5 transition hover:bg-white/5"
        >
          <h2 className="text-lg font-semibold">Reports</h2>
          <p className="mt-1 text-sm text-white/60">
            Moderate reported content
          </p>
        </Link>
      </section>
    </main>
  )
}