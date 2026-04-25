import { requireActiveUser } from "@/modules/auth/server/require-active-user"
import {
  assertPassVerified,
  getPassVerificationRedirectPath,
} from "@/modules/auth/server/assert-pass-verified"
import { redirect } from "next/navigation"
import { searchCreators } from "@/modules/search/server/search-creators"
import { SearchInfiniteList } from "@/modules/search/ui/SearchInfiniteList"
import { getExplorePosts } from "@/modules/search/server/get-explore-posts"
import { getExploreCreators } from "@/modules/search/server/get-explore-creators"

import { ExplorePostGrid } from "@/modules/search/ui/ExplorePostGrid"
import { ExploreCreatorGrid } from "@/modules/search/ui/ExploreCreatorGrid"
import { SearchInput } from "@/modules/search/ui/SearchInput"
import type {
  CreatorSearchConnection,
  DiscoveryCreatorLinkItem,
  DiscoveryPostLinkItem,
} from "@/modules/search/types"

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>
}

const EMPTY_SEARCH_RESULT: CreatorSearchConnection = {
  items: [],
  nextCursor: null,
}

const EMPTY_EXPLORE_POSTS: DiscoveryPostLinkItem[] = []
const EMPTY_EXPLORE_CREATORS: DiscoveryCreatorLinkItem[] = []

async function loadSearchResult(
  query: string
): Promise<CreatorSearchConnection> {
  if (!query) {
    return EMPTY_SEARCH_RESULT
  }

  try {
    return await searchCreators({
      query,
      limit: 20,
    })
  } catch (error) {
    console.error("[search/page] searchCreators failed:", error)
    return EMPTY_SEARCH_RESULT
  }
}

async function loadExploreData(): Promise<{
  posts: DiscoveryPostLinkItem[]
  creators: DiscoveryCreatorLinkItem[]
}> {
  const [posts, creators] = await Promise.all([
    getExplorePosts(24).catch((error) => {
      console.error("[search/page] getExplorePosts failed:", error)
      return EMPTY_EXPLORE_POSTS
    }),
    getExploreCreators(6).catch((error) => {
      console.error("[search/page] getExploreCreators failed:", error)
      return EMPTY_EXPLORE_CREATORS
    }),
  ])

  console.log("[search/page] explorePosts count:", posts.length)
  console.log("[search/page] exploreCreators count:", creators.length)

  return { posts, creators }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const user = await requireActiveUser()
  const { q = "" } = await searchParams
  const query = q.trim()

  try {
    await assertPassVerified({ profileId: user.id })
  } catch {
    const nextSearchParams = new URLSearchParams()

    if (query) {
      nextSearchParams.set("q", query)
    }

    const nextQuery = nextSearchParams.toString()

    redirect(
      getPassVerificationRedirectPath({
        next: nextQuery ? `/search?${nextQuery}` : "/search",
      })
    )
  }

  const searchResult = await loadSearchResult(query)
  let explorePosts: DiscoveryPostLinkItem[] = EMPTY_EXPLORE_POSTS
  let exploreCreators: DiscoveryCreatorLinkItem[] = EMPTY_EXPLORE_CREATORS

  if (!query) {
    const exploreData = await loadExploreData()
    explorePosts = exploreData.posts
    exploreCreators = exploreData.creators
  }

  return (
    <main className="w-full py-6">
      <form action="/search" className="mb-6 px-4">
        <SearchInput defaultValue={query} />
      </form>

      {query ? (
        <section className="space-y-4 px-4">
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
            <section className="my-6 px-4">
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
