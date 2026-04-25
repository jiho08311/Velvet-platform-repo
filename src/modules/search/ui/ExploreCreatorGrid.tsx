import Link from "next/link"
import type { DiscoveryCreatorLinkItem } from "../types"

type ExploreCreatorGridProps = {
  creators: DiscoveryCreatorLinkItem[]
}

export function ExploreCreatorGrid({
  creators,
}: ExploreCreatorGridProps) {
  return (
    <section className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
      {creators.map((creator) => (
        <Link
          key={creator.id}
          href={`/creator/${creator.username}`}
          className="snap-start shrink-0 rounded-2xl bg-zinc-900 px-4 py-3 transition hover:bg-zinc-800"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-white">
              {(creator.displayName ?? creator.username)
                .slice(0, 1)
                .toUpperCase()}
            </div>

            <div className="min-w-[80px]">
              <p className="truncate text-sm font-medium text-white">
                {creator.displayName ?? creator.username}
              </p>
              <p className="truncate text-xs text-zinc-400">
                @{creator.username}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </section>
  )
}
