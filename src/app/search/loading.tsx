export default function SearchLoadingPage() {
  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-5xl animate-pulse space-y-6">
        {/* header */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
          <div className="h-3 w-20 rounded bg-zinc-800" />
          <div className="h-8 w-40 rounded bg-zinc-800" />
          <div className="h-4 w-80 rounded bg-zinc-800" />

          <div className="flex gap-3">
            <div className="h-10 flex-1 rounded-xl bg-zinc-800" />
            <div className="h-10 w-24 rounded-full bg-zinc-800" />
          </div>
        </div>

        {/* creators */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
          <div className="h-5 w-32 rounded bg-zinc-800" />

          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
              >
                <div className="h-12 w-12 rounded-full bg-zinc-800" />

                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-zinc-800" />
                  <div className="h-3 w-24 rounded bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}