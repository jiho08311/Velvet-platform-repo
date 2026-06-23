import { requireActiveSession } from "@/modules/auth/public/require-active-session"
import {
  assertPassVerified,
  getPassVerificationRedirectPath,
} from "@/modules/auth/public/assert-pass-verified"
import { redirect } from "next/navigation"
import { searchCreators } from "@/modules/search/public/search-creators"
import { getExplorePosts } from "@/modules/search/public/get-explore-posts"
import { getExploreCreators } from "@/modules/search/public/get-explore-creators"

import {
  ExploreCreatorGrid,
  ExplorePostGrid,
  SearchInfiniteList,
  SearchInput,
} from "@/modules/search/public/search-page-ui"
import { logger } from "@/shared/observability/structured-logger"
import type {
  CreatorSearchConnection,
} from "@/modules/search/creator-search-contract"
import type {
  DiscoveryCreatorLinkItem,
  DiscoveryPostLinkItem,
} from "@/modules/search/discovery-contract"

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
    logger.error({
      event: "search.page_creator_search_failed",
      context: { hasQuery: true },
      error,
    })
    return EMPTY_SEARCH_RESULT
  }
}

async function loadExploreData(): Promise<{
  posts: DiscoveryPostLinkItem[]
  creators: DiscoveryCreatorLinkItem[]
}> {
  const [posts, creators] = await Promise.all([
    getExplorePosts(24).catch((error) => {
      logger.error({
        event: "search.page_explore_posts_failed",
        error,
      })
      return EMPTY_EXPLORE_POSTS
    }),
    getExploreCreators(6).catch((error) => {
      logger.error({
        event: "search.page_explore_creators_failed",
        error,
      })
      return EMPTY_EXPLORE_CREATORS
    }),
  ])

  return { posts, creators }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const session = await requireActiveSession()
  const { q = "" } = await searchParams
  const query = q.trim()

  try {
    await assertPassVerified({ profileId: session.userId })
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
