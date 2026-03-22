// src/app/bookmarks/loading.tsx
export default function BookmarksLoading() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10">
      <div className="mx-auto max-w-4xl animate-pulse space-y-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5"
          >
            <div className="h-40 rounded-xl bg-zinc-800" />
            <div className="mt-4 h-4 w-3/4 rounded bg-zinc-800" />
            <div className="mt-2 h-4 w-1/2 rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    </main>
  )
}