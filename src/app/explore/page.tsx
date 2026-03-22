import Link from "next/link"
import { searchCreators } from "@/modules/search/server/search-creators"

type ExplorePageProps = {
  searchParams?: {
    q?: string
  }
}

export default async function ExplorePage({
  searchParams,
}: ExplorePageProps) {
  const query = searchParams?.q?.trim() ?? ""
  const creators = query
    ? await searchCreators({
        query,
        limit: 20,
      })
    : []

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <section className="rounded-2xl border border-white/10 bg-neutral-950 p-5">
        <h1 className="text-xl font-semibold text-white">Explore creators</h1>
        <p className="mt-1 text-sm text-white/60">
          Search creators by display name, username, or headline.
        </p>

        <form action="/explore" className="mt-4">
          <div className="flex gap-3">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search creators"
              className="h-12 flex-1 rounded-full border border-white/10 bg-neutral-900 px-4 text-sm text-white outline-none placeholder:text-white/35"
            />
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white px-5 text-sm font-medium text-black transition hover:bg-white/90"
            >
              Search
            </button>
          </div>
        </form>
      </section>

      {!query ? (
        <section className="rounded-2xl border border-white/10 bg-neutral-950 p-8 text-center text-sm text-white/60">
          Enter a search term to explore creators.
        </section>
      ) : creators.length === 0 ? (
        <section className="rounded-2xl border border-white/10 bg-neutral-950 p-8 text-center text-sm text-white/60">
          No creators found.
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((creator) => (
            <Link
              key={creator.id}
              href={`/creator/${creator.username}`}
              className="block rounded-2xl border border-white/10 bg-neutral-950 p-5 transition hover:border-white/20 hover:bg-neutral-900"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
                  {creator.avatarUrl ? (
                    <img
                      src={creator.avatarUrl}
                      alt={creator.displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-white/70">
                      {creator.displayName.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-base font-semibold text-white">
                      {creator.displayName}
                    </h2>
                    {creator.isVerified ? (
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/75">
                        Verified
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 text-sm text-white/50">
                    @{creator.username}
                  </p>

                  {creator.headline ? (
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/70">
                      {creator.headline}
                    </p>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  )
}