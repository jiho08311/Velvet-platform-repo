import type { CreatorSearchResult } from "../types"
import { ExploreCreatorCard } from "./ExploreCreatorCard"

type ExploreCreatorGridProps = {
  creators: CreatorSearchResult[]
}

export function ExploreCreatorGrid({
  creators,
}: ExploreCreatorGridProps) {
  if (creators.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900/70 p-10 text-center">
        <div className="text-4xl">🔍</div>

        <p className="mt-4 text-base font-semibold text-white">
          No creators found
        </p>

        <p className="mt-1 text-sm text-zinc-400">
          Try searching with a different keyword.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {creators.map((creator) => (
        <ExploreCreatorCard key={creator.id} creator={creator} />
      ))}
    </div>
  )
}