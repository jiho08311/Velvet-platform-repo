import { listPayouts } from "@/modules/payout/server/list-payouts"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function getStatusClassName(status: "pending" | "approved" | "rejected") {
  if (status === "pending") {
    return "border-amber-500/20 bg-amber-500/15 text-amber-300"
  }

  if (status === "approved") {
    return "border-emerald-500/20 bg-emerald-500/15 text-emerald-300"
  }

  return "border-red-500/20 bg-red-500/10 text-red-300"
}

export default async function AdminPayoutsPage() {
  const payouts = await listPayouts()

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
            Admin
          </p>
          <h1 className="text-3xl font-semibold text-white">Payouts</h1>
          <p className="text-sm text-zinc-400">
            Review creator payout requests and current statuses.
          </p>
        </div>

        {payouts.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 p-12 text-center">
            <h2 className="text-2xl font-semibold text-white">
              No payout requests
            </h2>
            <p className="mt-3 text-sm text-zinc-400">
              Incoming payout requests will appear here.
            </p>
          </section>
        ) : (
          <section className="grid gap-4">
            {payouts.map((payout) => (
              <article
                key={payout.id}
                className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-2xl shadow-black/20"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="truncate text-lg font-semibold text-white">
                        {payout.creator.displayName}
                      </h2>
                      <span className="text-sm text-zinc-500">•</span>
                      <p className="text-sm text-zinc-400">
                        @{payout.creator.username}
                      </p>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${getStatusClassName(
                          payout.status
                        )}`}
                      >
                        {payout.status}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-zinc-500">
                      {formatDate(payout.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-3 md:items-end">
                    <p className="text-2xl font-semibold text-white">
                      {payout.amount}
                    </p>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}