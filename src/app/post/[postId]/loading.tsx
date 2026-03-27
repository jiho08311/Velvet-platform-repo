export default function PostDetailLoading() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-6 w-32 animate-pulse rounded bg-zinc-800" />

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="h-4 w-40 animate-pulse rounded bg-zinc-800" />

          <div className="mt-4 h-8 w-2/3 animate-pulse rounded bg-zinc-700" />

          <div className="mt-6 space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-800" />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="h-64 animate-pulse rounded-2xl bg-zinc-800" />
            <div className="h-64 animate-pulse rounded-2xl bg-zinc-800" />
          </div>
        </div>
      </div>
    </main>
  )
}