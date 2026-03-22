// src/app/messages/loading.tsx
export default function MessagesLoading() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10">
      <div className="mx-auto max-w-3xl animate-pulse space-y-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4"
          >
            <div className="h-10 w-10 rounded-full bg-zinc-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded bg-zinc-800" />
              <div className="h-3 w-60 rounded bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}