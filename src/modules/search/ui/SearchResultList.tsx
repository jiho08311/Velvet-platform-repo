import Link from "next/link"
import { buildCreatorRoutePath } from "@/modules/creator/lib/creator-identity"
import type { CreatorSearchResult } from "../creator-search-contract"

type SearchResultListProps = {
  results: CreatorSearchResult[]
  emptyMessage?: string
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
    <section className="overflow-hidden rounded-md border border-zinc-200 bg-white">
      <ul className="divide-y divide-zinc-200">
        {results.map((creator) => (
          <li key={creator.id} className="hover:bg-zinc-50">
            <Link
              href={buildCreatorRoutePath({ username: creator.username })}
              className="block px-4 py-3"
            >
              <p className="text-sm font-medium text-zinc-900">
                {creator.displayName ?? creator.username}
              </p>
              <p className="text-xs text-zinc-500">@{creator.username}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
