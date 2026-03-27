export default function CreatorProfileLoading() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
          <div className="h-32 animate-pulse bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 sm:h-40" />

          <div className="px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="-mt-10 flex flex-col gap-5 sm:-mt-12">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <div className="h-20 w-20 shrink-0 animate-pulse rounded-full border-2 border-zinc-900 bg-zinc-800 sm:h-24 sm:w-24" />

                  <div className="min-w-0 flex-1 pt-2">
                    <div className="h-4 w-24 animate-pulse rounded-full bg-zinc-800" />
                    <div className="mt-3 h-10 w-56 animate-pulse rounded-2xl bg-zinc-800" />
                    <div className="mt-4 h-4 w-full max-w-xl animate-pulse rounded-full bg-zinc-800" />
                    <div className="mt-2 h-4 w-full max-w-lg animate-pulse rounded-full bg-zinc-800" />
                    <div className="mt-4 h-10 w-32 animate-pulse rounded-full bg-[#C2185B]/20" />
                    <div className="mt-4 h-3 w-20 animate-pulse rounded-full bg-zinc-800" />
                    <div className="mt-2 h-4 w-40 animate-pulse rounded-full bg-zinc-800" />
                  </div>
                </div>

                <div className="h-11 w-full animate-pulse rounded-full bg-zinc-800 sm:w-36" />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4"
                  >
                    <div className="h-3 w-24 animate-pulse rounded-full bg-zinc-800" />
                    <div className="mt-3 h-8 w-20 animate-pulse rounded-2xl bg-zinc-800" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div>
            <div className="h-3 w-12 animate-pulse rounded-full bg-[#C2185B]/20" />
            <div className="mt-3 h-8 w-40 animate-pulse rounded-2xl bg-zinc-800" />
          </div>

          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <article
                key={index}
                className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70"
              >
                <div className="flex flex-col gap-3 border-b border-zinc-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="h-4 w-40 animate-pulse rounded-full bg-zinc-800" />
                  <div className="h-7 w-20 animate-pulse rounded-full bg-zinc-800" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 px-5 sm:grid-cols-3">
                  {Array.from({ length: 3 }).map((__, mediaIndex) => (
                    <div
                      key={mediaIndex}
                      className="aspect-square animate-pulse rounded-2xl border border-zinc-800 bg-zinc-800"
                    />
                  ))}
                </div>

                <div className="px-5 pb-5 pt-4">
                  <div className="h-4 w-full animate-pulse rounded-full bg-zinc-800" />
                  <div className="mt-2 h-4 w-5/6 animate-pulse rounded-full bg-zinc-800" />
                  <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-zinc-800" />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}