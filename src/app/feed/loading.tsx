export default function FeedLoading() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
          <div className="border-b border-zinc-200 bg-gradient-to-r from-[#FCE4EC] via-white to-[#FFF1F5] px-6 py-6">
            <div className="h-3 w-12 animate-pulse rounded-full bg-[#F8BBD0]" />
            <div className="mt-4 h-10 w-48 animate-pulse rounded-2xl bg-zinc-200" />
            <div className="mt-3 h-4 w-full max-w-md animate-pulse rounded-full bg-zinc-200" />
          </div>

          <div className="p-6">
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <article
                  key={index}
                  className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
                >
                  <div className="grid grid-cols-2 gap-1 border-b border-zinc-200 bg-zinc-50 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((__, mediaIndex) => (
                      <div
                        key={mediaIndex}
                        className="aspect-square animate-pulse bg-zinc-200"
                      />
                    ))}
                  </div>

                  <div className="p-5">
                    <div className="h-4 w-3/4 animate-pulse rounded-full bg-zinc-200" />
                    <div className="mt-3 h-4 w-1/2 animate-pulse rounded-full bg-zinc-200" />
                    <div className="mt-5 h-3 w-24 animate-pulse rounded-full bg-zinc-200" />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}