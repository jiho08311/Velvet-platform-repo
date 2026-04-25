import { requireAdmin } from "@/modules/admin/server/require-admin"
import { AdminBadge } from "@/modules/admin/ui/AdminBadge"
import { listModerationQueue } from "@/modules/moderation/server/list-moderation-queue"

export default async function AdminModerationPage() {
  await requireAdmin()

  const items = await listModerationQueue()

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">
          Moderation Queue
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Review queued moderation items without changing moderation outcomes.
        </p>
      </div>

      {items.length === 0 ? (
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 text-sm text-zinc-400">
          No moderation queue items found.
        </section>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
          <div className="grid grid-cols-5 gap-4 border-b border-zinc-800 px-5 py-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
            <div>Target</div>
            <div>Target ID</div>
            <div>Reason</div>
            <div>Status</div>
            <div>Created</div>
          </div>

          <div className="divide-y divide-zinc-800">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-5 gap-4 px-5 py-4 text-sm text-white"
              >
                <div className="min-w-0">
                  <p className="font-medium">{item.targetReference.type}</p>
                  <p className="mt-1 truncate text-xs text-zinc-500">
                    {item.id}
                  </p>
                </div>

                <div className="truncate text-zinc-300">
                  {item.targetReference.id}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-zinc-300">{item.reason}</p>
                </div>

                <div>
                  <AdminBadge
                    label={item.statusBadge.label}
                    tone={item.statusBadge.tone}
                  />
                </div>

                <div className="text-zinc-400">
                  {item.createdDateTimeLabel}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
