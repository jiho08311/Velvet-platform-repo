import Link from "next/link"
import { buildCreatorRoutePath } from "@/modules/creator/public/creator-identity"
import type { CreatorSearchResult } from "../creator-search-contract"

type SearchResultListProps = {
  results: CreatorSearchResult[]
  emptyMessage?: string
}

type SearchResultCreatorCardProps = {
  creator: CreatorSearchResult
}

function getCreatorDisplayName(creator: CreatorSearchResult) {
  return creator.displayName ?? creator.username
}

function getCreatorInitial(creator: CreatorSearchResult) {
  return getCreatorDisplayName(creator).slice(0, 1).toUpperCase()
}

function SearchResultCreatorAvatar({ creator }: SearchResultCreatorCardProps) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-white">
      {getCreatorInitial(creator)}
    </div>
  )
}

export function SearchResultCreatorCard({
  creator,
}: SearchResultCreatorCardProps) {
  const displayName = getCreatorDisplayName(creator)

  return (
    <Link
      href={buildCreatorRoutePath({ username: creator.username })}
      className="block rounded-2xl bg-zinc-900 px-4 py-3 transition hover:bg-zinc-800"
    >
      <div className="flex items-center gap-3">
        <SearchResultCreatorAvatar creator={creator} />

        <div className="min-w-0">
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

export function SearchResultList({
  results,
  emptyMessage = "No results found.",
}: SearchResultListProps) {
  if (results.length === 0) {
    return (
      <section className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center">
        <p className="text-sm text-zinc-500">{emptyMessage}</p>
      </section>
    )
  }

  return (
    <section className="grid gap-2">
      <ul className="grid gap-2">
        {results.map((creator) => (
          <li key={creator.id}>
            <SearchResultCreatorCard creator={creator} />
          </li>
        ))}
      </ul>
    </section>
  )
}
