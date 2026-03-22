export default function SearchLoadingPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
          <div className="border-b border-zinc-200 bg-gradient-to-r from-[#FCE4EC] via-white to-[#FFF1F5] p-6">
            <div className="h-3 w-16 animate-pulse rounded-full bg-[#F8BBD0]" />
            <div className="mt-4 h-10 w-40 animate-pulse rounded-2xl bg-zinc-200" />
            <div className="mt-3 h-4 w-full max-w-md animate-pulse rounded-full bg-zinc-200" />

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <div className="h-11 flex-1 animate-pulse rounded-2xl bg-zinc-200" />
              <div className="h-11 w-28 animate-pulse rounded-full bg-[#F8BBD0]" />
            </div>

            <div className="mt-4 h-4 w-48 animate-pulse rounded-full bg-zinc-200" />
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="h-3 w-16 animate-pulse rounded-full bg-[#F8BBD0]" />
              <div className="mt-3 h-7 w-28 animate-pulse rounded-2xl bg-zinc-200" />
            </div>
            <div className="h-4 w-20 animate-pulse rounded-full bg-zinc-200" />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex items-start gap-4 rounded-3xl border border-zinc-200 bg-zinc-50 p-4"
              >
                <div className="h-14 w-14 animate-pulse rounded-full bg-zinc-200" />
                <div className="min-w-0 flex-1">
                  <div className="h-4 w-32 animate-pulse rounded-full bg-zinc-200" />
                  <div className="mt-2 h-3 w-24 animate-pulse rounded-full bg-zinc-200" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="h-3 w-12 animate-pulse rounded-full bg-[#F8BBD0]" />
              <div className="mt-3 h-7 w-20 animate-pulse rounded-2xl bg-zinc-200" />
            </div>
            <div className="h-4 w-20 animate-pulse rounded-full bg-zinc-200" />
          </div>

          <div className="mt-4 grid gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <article
                key={index}
                className="overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50"
              >
                <div className="flex items-center justify-between px-5 pt-5">
                  <div className="h-4 w-12 animate-pulse rounded-full bg-zinc-200" />
                  <div className="h-3 w-28 animate-pulse rounded-full bg-zinc-200" />
                </div>

                <div className="px-5 py-4">
                  <div className="h-4 w-full animate-pulse rounded-full bg-zinc-200" />
                  <div className="mt-2 h-4 w-5/6 animate-pulse rounded-full bg-zinc-200" />
                  <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-zinc-200" />
                </div>

                <div className="border-t border-zinc-200 p-5">
                  <div className="h-56 animate-pulse rounded-2xl bg-zinc-200" />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}