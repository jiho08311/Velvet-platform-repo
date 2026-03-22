export default function NotificationsLoading() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
        <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
          <div className="border-b border-zinc-200 bg-gradient-to-r from-[#FCE4EC] via-white to-[#FFF1F5] p-6">
            <div className="h-3 w-24 animate-pulse rounded-full bg-[#F8BBD0]" />
            <div className="mt-4 h-10 w-48 animate-pulse rounded-2xl bg-zinc-200" />
            <div className="mt-3 h-4 w-full max-w-md animate-pulse rounded-full bg-zinc-200" />
          </div>

          <div className="divide-y divide-zinc-200">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="px-5 py-4 transition-all duration-200 ease-out"
              >
                <div className="flex items-center gap-2">
                  <div className="h-6 w-16 animate-pulse rounded-full bg-zinc-200" />
                  <div className="h-6 w-20 animate-pulse rounded-full bg-zinc-200" />
                </div>

                <div className="mt-3 h-4 w-60 animate-pulse rounded-full bg-zinc-200" />
                <div className="mt-2 h-3 w-40 animate-pulse rounded-full bg-zinc-200" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}