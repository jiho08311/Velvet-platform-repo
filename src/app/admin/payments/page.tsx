import { listPayments } from "@/modules/payment/server/list-payments"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function getStatusClassName(status: "succeeded" | "pending" | "failed" | "refunded") {
  if (status === "succeeded") {
    return "border-emerald-500/20 bg-emerald-500/15 text-emerald-300"
  }

  if (status === "pending") {
    return "border-amber-500/20 bg-amber-500/15 text-amber-300"
  }

  if (status === "refunded") {
    return "border-blue-500/20 bg-blue-500/15 text-blue-300"
  }

  return "border-red-500/20 bg-red-500/10 text-red-300"
}

export default async function AdminPaymentsPage() {
  const payments = await listPayments()

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
            Admin
          </p>
          <h1 className="text-3xl font-semibold text-white">Payments</h1>
          <p className="text-sm text-zinc-400">
            Review payment activity and current transaction statuses.
          </p>
        </div>

        {payments.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 p-12 text-center">
            <h2 className="text-2xl font-semibold text-white">
              No payments found
            </h2>
            <p className="mt-3 text-sm text-zinc-400">
              Payment records will appear here when transactions are available.
            </p>
          </section>
        ) : (
          <section className="grid gap-4">
            {payments.map((payment) => (
              <article
                key={payment.id}
                className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-2xl shadow-black/20"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold text-white">
                        {payment.amount}
                      </h2>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${getStatusClassName(
                          payment.status
                        )}`}
                      >
                        {payment.status}
                      </span>

                      <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-300">
                        {payment.paymentType}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-zinc-400">
                      <p>
                        User:{" "}
                        {payment.user
                          ? `${payment.user.displayName} (@${payment.user.username})`
                          : "—"}
                      </p>
                      <p>
                        Creator:{" "}
                        {payment.creator
                          ? `${payment.creator.displayName} (@${payment.creator.username})`
                          : "—"}
                      </p>
                      <p>{formatDate(payment.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900"
                    >
                      View details
                    </button>
                    <button
                      type="button"
                      className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
                    >
                      Refund
                    </button>
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