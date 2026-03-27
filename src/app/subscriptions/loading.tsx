// src/app/subscriptions/loading.tsx
export default function SubscriptionsLoading() {
  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto max-w-4xl animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"
          >
            <div className="h-12 w-12 rounded-full bg-zinc-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded bg-zinc-800" />
              <div className="h-3 w-32 rounded bg-zinc-800" />
            </div>
            <div className="h-8 w-20 rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    </main>
  )
}