import { listModerationQueue } from "@/modules/moderation/server/list-moderation-queue"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function getStatusClassName(status: "pending" | "reviewed" | "resolved") {
  if (status === "pending") {
    return "border-amber-500/20 bg-amber-500/15 text-amber-300"
  }

  if (status === "reviewed") {
    return "border-blue-500/20 bg-blue-500/15 text-blue-300"
  }

  return "border-emerald-500/20 bg-emerald-500/15 text-emerald-300"
}

export default async function AdminModerationPage() {
  const moderationQueue = await listModerationQueue()

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
            Admin
          </p>
          <h1 className="text-3xl font-semibold text-white">Moderation</h1>
          <p className="text-sm text-zinc-400">
            Review the moderation queue and pending content actions.
          </p>
        </div>

        {moderationQueue.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 p-12 text-center">
            <h2 className="text-2xl font-semibold text-white">
              No moderation items
            </h2>
            <p className="mt-3 text-sm text-zinc-400">
              Moderation tasks will appear here when reports need review.
            </p>
          </section>
        ) : (
          <section className="grid gap-4">
            {moderationQueue.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-2xl shadow-black/20"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-medium capitalize text-zinc-300">
                        {item.targetType}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${getStatusClassName(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-zinc-200">
                      {item.reason}
                    </p>
                    <p className="mt-2 text-sm text-zinc-500">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900"
                    >
                      Review
                    </button>
                    <button
                      type="button"
                      className="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
                    >
                      Resolve
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