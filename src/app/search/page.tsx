import Link from "next/link"

import { searchCreators } from "@/modules/search/server/search-creators"
import { searchPosts } from "@/modules/search/server/search-posts"
import { Card } from "@/shared/ui/Card"
import { EmptyState } from "@/shared/ui/EmptyState"

type SearchPageProps = {
  searchParams: Promise<{
    q?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams
  const query = q.trim()

  const [creators, posts] = query
    ? await Promise.all([
        searchCreators({ query, limit: 12 }),
        searchPosts({ query, limit: 12 }),
      ])
    : [[], []]

  const isEmpty = query.length > 0 && creators.length === 0 && posts.length === 0

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-zinc-200 bg-gradient-to-r from-[#FCE4EC] via-white to-[#FFF1F5] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C2185B]">
              Search
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">
              Search
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Search creators and posts across the platform.
            </p>

            <form action="/search" method="get" className="mt-5">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  name="q"
                  defaultValue={query}
                  placeholder="Search creators or posts..."
                  className="h-11 flex-1 rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition-all duration-200 ease-out placeholder:text-zinc-400 focus:border-[#C2185B] focus:ring-2 focus:ring-[#C2185B]/20"
                />
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[#C2185B] px-5 text-sm font-medium text-white transition-all duration-200 ease-out hover:bg-[#D81B60]"
                >
                  Search
                </button>
              </div>
            </form>

            <div className="mt-3 text-sm text-zinc-500">
              {query ? (
                <span>
                  Results for <span className="text-zinc-900">"{query}"</span>
                </span>
              ) : (
                <span>Enter a keyword to search.</span>
              )}
            </div>
          </div>
        </Card>

        {isEmpty ? (
          <Card className="p-6">
            <EmptyState
              title="No results found"
              description="Try a different keyword or search for another creator or post."
            />
          </Card>
        ) : (
          <>
            <Card className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C2185B]">
                    Creators
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-zinc-900">
                    Creators
                  </h2>
                </div>
                <p className="text-sm text-zinc-500">{creators.length} result(s)</p>
              </div>

              {query.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    title="Search creators"
                    description="Search for creators by username or display name."
                  />
                </div>
              ) : creators.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    title="No creators found"
                    description="Try another keyword to find creators."
                  />
                </div>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {creators.map((creator) => {
                    const creatorData = creator as {
                      id: string
                      username: string
                      displayName: string
                      avatarUrl?: string | null
                    }

                    return (
                      <Link
                        key={creatorData.id}
                        href={`/creator/${creatorData.username}`}
                        className="flex items-start gap-4 rounded-3xl border border-zinc-200 bg-zinc-50 p-4 transition-all duration-200 ease-out hover:border-[#C2185B]/30 hover:bg-white"
                      >
                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-white text-sm font-semibold text-zinc-900">
                          {creatorData.avatarUrl ? (
                            <img
                              src={creatorData.avatarUrl}
                              alt={creatorData.displayName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            creatorData.displayName.slice(0, 1).toUpperCase()
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-900">
                            {creatorData.displayName}
                          </p>
                          <p className="truncate text-xs text-zinc-500">
                            @{creatorData.username}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C2185B]">
                    Posts
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-zinc-900">Posts</h2>
                </div>
                <p className="text-sm text-zinc-500">{posts.length} result(s)</p>
              </div>

              {query.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    title="Search posts"
                    description="Search for posts by content or title."
                  />
                </div>
              ) : posts.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    title="No posts found"
                    description="Try another keyword to find posts."
                  />
                </div>
              ) : (
                <div className="mt-4 grid gap-4">
                  {posts.map((post) => {
                    const postData = post as {
                      id: string
                      createdAt: string
                      title?: string | null
                      content?: string | null
                    }

                    return (
                      <article
                        key={postData.id}
                        className="overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 transition-all duration-200 ease-out hover:border-[#C2185B]/30 hover:bg-white"
                      >
                        <div className="flex items-center justify-between px-5 pt-5">
                          <p className="truncate text-sm font-medium text-zinc-900">
                            Post
                          </p>

                          <p className="text-xs text-zinc-500">
                            {new Date(postData.createdAt).toLocaleString()}
                          </p>
                        </div>

                        <div className="px-5 py-4">
                          <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                            {postData.content ?? postData.title ?? ""}
                          </p>
                        </div>

                        <div className="border-t border-zinc-200 p-5">
                          <div className="flex h-56 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-white text-sm text-zinc-500">
                            Media thumbnail
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </main>
  )
}