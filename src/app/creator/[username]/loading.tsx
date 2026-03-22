export default function CreatorProfileLoading() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <div className="h-32 animate-pulse bg-gradient-to-r from-[#FCE4EC] via-white to-[#FFF1F5] sm:h-40" />

          <div className="px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="-mt-10 flex flex-col gap-5 sm:-mt-12">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <div className="h-20 w-20 shrink-0 animate-pulse rounded-full border-2 border-white bg-zinc-200 shadow-lg sm:h-24 sm:w-24" />

                  <div className="min-w-0 flex-1 pt-2">
                    <div className="h-4 w-24 animate-pulse rounded-full bg-zinc-200" />
                    <div className="mt-3 h-10 w-56 animate-pulse rounded-2xl bg-zinc-200" />
                    <div className="mt-4 h-4 w-full max-w-xl animate-pulse rounded-full bg-zinc-200" />
                    <div className="mt-2 h-4 w-full max-w-lg animate-pulse rounded-full bg-zinc-200" />
                    <div className="mt-4 h-10 w-32 animate-pulse rounded-full bg-[#FCE4EC]" />
                    <div className="mt-4 h-3 w-20 animate-pulse rounded-full bg-zinc-200" />
                    <div className="mt-2 h-4 w-40 animate-pulse rounded-full bg-zinc-200" />
                  </div>
                </div>

                <div className="h-11 w-full animate-pulse rounded-full bg-zinc-200 sm:w-36" />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4"
                  >
                    <div className="h-3 w-24 animate-pulse rounded-full bg-zinc-200" />
                    <div className="mt-3 h-8 w-20 animate-pulse rounded-2xl bg-zinc-200" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div>
            <div className="h-3 w-12 animate-pulse rounded-full bg-[#F8BBD0]" />
            <div className="mt-3 h-8 w-40 animate-pulse rounded-2xl bg-zinc-200" />
          </div>

          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <article
                key={index}
                className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
              >
                <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="h-4 w-40 animate-pulse rounded-full bg-zinc-200" />
                  <div className="h-7 w-20 animate-pulse rounded-full bg-zinc-200" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 px-5 sm:grid-cols-3">
                  {Array.from({ length: 3 }).map((__, mediaIndex) => (
                    <div
                      key={mediaIndex}
                      className="aspect-square animate-pulse rounded-2xl border border-zinc-200 bg-zinc-200"
                    />
                  ))}
                </div>

                <div className="px-5 pb-5 pt-4">
                  <div className="h-4 w-full animate-pulse rounded-full bg-zinc-200" />
                  <div className="mt-2 h-4 w-5/6 animate-pulse rounded-full bg-zinc-200" />
                  <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-zinc-200" />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}