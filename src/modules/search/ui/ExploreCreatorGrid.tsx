import Link from "next/link"
import { buildCreatorRoutePath } from "@/modules/creator/public/creator-identity"
import type { DiscoveryCreatorLinkItem } from "../discovery-contract"

type ExploreCreatorGridProps = {
  creators: DiscoveryCreatorLinkItem[]
}

type ExploreCreatorCardProps = {
  creator: DiscoveryCreatorLinkItem
}

function getCreatorDisplayName(creator: DiscoveryCreatorLinkItem) {
  return creator.displayName ?? creator.username
}

function getCreatorInitial(creator: DiscoveryCreatorLinkItem) {
  return getCreatorDisplayName(creator).slice(0, 1).toUpperCase()
}

function ExploreCreatorAvatar({ creator }: ExploreCreatorCardProps) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-white">
      {getCreatorInitial(creator)}
    </div>
  )
}

function ExploreCreatorCard({ creator }: ExploreCreatorCardProps) {
  const displayName = getCreatorDisplayName(creator)

  return (
    <Link
      href={buildCreatorRoutePath({ username: creator.username })}
      className="snap-start shrink-0 rounded-2xl bg-zinc-900 px-4 py-3 transition hover:bg-zinc-800"
    >
      <div className="flex items-center gap-3">
        <ExploreCreatorAvatar creator={creator} />

        <div className="min-w-[80px]">
          <p className="truncate text-sm font-medium text-white">
            {displayName}
          </p>
          <p className="truncate text-xs text-zinc-400">
            @{creator.username}
          </p>
        </div>
      </div>
    </Link>
  )
}

export function ExploreCreatorGrid({
  creators,
}: ExploreCreatorGridProps) {
  return (
    <section className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
      {creators.map((creator) => (
        <ExploreCreatorCard key={creator.id} creator={creator} />
      ))}
    </section>
  )
}
