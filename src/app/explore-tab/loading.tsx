export default function ExploreLoading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
        <div className="h-7 w-40 rounded-full bg-zinc-800" />
        <div className="mt-2 h-4 w-72 rounded-full bg-zinc-800" />

        <div className="mt-4 flex gap-3">
          <div className="h-12 flex-1 rounded-full bg-zinc-800" />
          <div className="h-12 w-28 rounded-full bg-zinc-800" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5"
          >
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-full bg-zinc-800" />

              <div className="min-w-0 flex-1">
                <div className="h-5 w-32 rounded-full bg-zinc-800" />
                <div className="mt-2 h-4 w-24 rounded-full bg-zinc-800" />
                <div className="mt-3 h-4 w-full rounded-full bg-zinc-800" />
                <div className="mt-2 h-4 w-3/4 rounded-full bg-zinc-800" />
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  )
}