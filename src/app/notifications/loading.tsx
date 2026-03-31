export default function NotificationsLoading() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl animate-pulse space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-2"
          >
            <div className="flex gap-2">
              <div className="h-5 w-16 rounded bg-zinc-800" />
              <div className="h-5 w-20 rounded bg-zinc-800" />
            </div>

            <div className="h-4 w-60 rounded bg-zinc-800" />
            <div className="h-3 w-40 rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    </main>
  )
}