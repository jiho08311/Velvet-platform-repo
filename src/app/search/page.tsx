import Link from "next/link"
import { redirect } from "next/navigation"

import { assertPassVerified } from "@/modules/auth/server/assert-pass-verified"
import { requireUser } from "@/modules/auth/server/require-user"
import { searchCreators } from "@/modules/search/server/search-creators"

import { Card } from "@/shared/ui/Card"
import { EmptyState } from "@/shared/ui/EmptyState"

type SearchPageProps = {
  searchParams: Promise<{
    q?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const user = await requireUser()

  try {
    await assertPassVerified({ profileId: user.id })
  } catch {
    redirect("/verify-pass")
  }

  const { q = "" } = await searchParams
  const query = q.trim()

  const creators = query
    ? await searchCreators({ query, limit: 20 })
    : []

  const isEmpty = query.length > 0 && creators.length === 0

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
              Search creators across the platform.
            </p>

            <form action="/search" method="get" className="mt-5">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  name="q"
                  defaultValue={query}
                  placeholder="Search creators."
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
                <span>Enter a keyword to search creators.</span>
              )}
            </div>
          </div>
        </Card>

        {isEmpty ? (
          <Card className="p-6">
            <EmptyState
              title="No results found"
              description="Try a different keyword or search for another creator."
            />
          </Card>
        ) : (
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
                  description="Search for creators by display name or username."
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
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {creators.map((creator) => {
                  const creatorData = creator as {
                    id: string
                    username: string
                    displayName: string
                    avatarUrl?: string | null
                    headline?: string | null
                    bio?: string | null
                    isVerified?: boolean
                  }

                  return (
                    <Link
                      key={creatorData.id}
                      href={`/creator/${creatorData.username}`}
                      className="block rounded-3xl border border-zinc-200 bg-zinc-50 p-5 transition-all duration-200 ease-out hover:border-[#C2185B]/30 hover:bg-white"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-white text-sm font-semibold text-zinc-900">
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
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-zinc-900">
                              {creatorData.displayName}
                            </h3>

                            {creatorData.isVerified ? (
                              <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-600">
                                Verified
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-1 truncate text-xs text-zinc-500">
                            @{creatorData.username}
                          </p>

                          {creatorData.headline || creatorData.bio ? (
                            <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-600">
                              {creatorData.headline ?? creatorData.bio}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </Card>
        )}
      </div>
    </main>
  )
}