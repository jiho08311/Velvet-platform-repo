import Link from "next/link"

type ExploreCreatorItem = {
  id: string
  username: string
  displayName: string | null
  avatarUrl?: string | null
  headline?: string | null
}

type ExploreCreatorGridProps = {
  creators: ExploreCreatorItem[]
}

export function ExploreCreatorGrid({
  creators,
}: ExploreCreatorGridProps) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {creators.map((creator) => (
        <article
          key={creator.id}
          className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-white">
              {creator.displayName?.slice(0, 1) ??
                creator.username.slice(0, 1).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {creator.displayName ?? creator.username}
              </p>
              <p className="truncate text-xs text-zinc-400">
                @{creator.username}
              </p>
            </div>
          </div>

          <p className="mt-4 line-clamp-2 min-h-[40px] text-sm text-zinc-400">
            {creator.headline ?? "Discover this creator on Velvet."}
          </p>

          <Link
            href={`/creator/${creator.username}`}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-pink-600 px-4 text-sm font-medium text-white transition hover:bg-pink-500 active:bg-pink-700"
          >
            View creator
          </Link>
        </article>
      ))}
    </section>
  )
}