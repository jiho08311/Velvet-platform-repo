import { requireActiveUser } from "@/modules/auth/server/require-active-user"
import { assertPassVerified } from "@/modules/auth/server/assert-pass-verified"
import { redirect } from "next/navigation"
import { searchCreators } from "@/modules/search/server/search-creators"
import { SearchInfiniteList } from "@/modules/search/ui/SearchInfiniteList"
import { getExplorePosts } from "@/modules/search/server/get-explore-posts"
import { getExploreCreators } from "@/modules/search/server/get-explore-creators"

import { ExplorePostGrid } from "@/modules/search/ui/ExplorePostGrid"
import { ExploreCreatorGrid } from "@/modules/search/ui/ExploreCreatorGrid"
import { SearchInput } from "@/modules/search/ui/SearchInput"

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const user = await requireActiveUser()

  try {
    await assertPassVerified({ profileId: user.id })
  } catch {
    redirect("/verify-pass")
  }

  const { q = "" } = await searchParams
  const query = q.trim()

const searchResult = query
  ? await searchCreators({
      query,
      limit: 20,
    })
  : { items: [], nextCursor: null }

  const [explorePosts, exploreCreators] = !query
    ? await Promise.all([getExplorePosts(24), getExploreCreators(6)])
    : [[], []]

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <form action="/search" className="mb-6">
        <SearchInput defaultValue={query} />
      </form>

      {query ? (
        <section className="space-y-4">
          <p className="text-sm text-zinc-400">Results for "{query}"</p>

      {searchResult.items.length > 0 ? (
  <SearchInfiniteList
    query={query}
    initialCreators={searchResult.items}
    initialCursor={searchResult.nextCursor}
  />
) : (
  <p className="text-sm text-zinc-500">No creators found</p>
)}
        </section>
      ) : (
        <>
          <ExplorePostGrid posts={explorePosts.slice(0, 12)} />

          {exploreCreators.length > 0 && (
            <section className="my-6">
              <p className="mb-3 text-xs uppercase tracking-wider text-zinc-500">
                Discover creators
              </p>
              <ExploreCreatorGrid creators={exploreCreators} />
            </section>
          )}

          <ExplorePostGrid posts={explorePosts.slice(12)} />
        </>
      )}
    </main>
  )
}