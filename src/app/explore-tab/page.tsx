import { redirect } from "next/navigation"

import { assertPassVerified } from "@/modules/auth/server/assert-pass-verified"
import { requireUser } from "@/modules/auth/server/require-user"

import { searchCreators } from "@/modules/search/server/search-creators"
import { getExplorePosts } from "@/modules/search/server/get-explore-posts"

import { ExploreCreatorGrid } from "@/modules/search/ui/ExploreCreatorGrid"
import { ExplorePostGrid } from "@/modules/search/ui/ExplorePostGrid"

type ExplorePageProps = {
  searchParams: Promise<{
    q?: string
  }>
}

export default async function ExplorePage({
  searchParams,
}: ExplorePageProps) {
  const user = await requireUser()

  try {
    await assertPassVerified({ profileId: user.id })
  } catch {
    redirect("/verify-pass")
  }

  const { q = "" } = await searchParams
  const query = q.trim()

  const isSearching = query.length > 0

  const creators = isSearching
    ? await searchCreators({
        query,
        limit: 20,
      })
    : []

  const posts = isSearching ? [] : await getExplorePosts(24)

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
        <h1 className="text-xl font-semibold text-white">Explore</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {isSearching
            ? "Search creators by username or display name."
            : "Discover public image posts from creators."}
        </p>

        <form action="/explore-tab" className="mt-4">
          <div className="flex gap-3">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search creators"
              className="h-12 flex-1 rounded-full border border-zinc-800 bg-zinc-900 px-4 text-sm text-white outline-none placeholder:text-zinc-500"
            />
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-full bg-pink-600 px-5 text-sm font-medium text-white transition hover:bg-pink-500 active:bg-pink-700"
            >
              Search
            </button>
          </div>
        </form>
      </section>

      {isSearching ? (
        creators.length === 0 ? (
          <section className="flex flex-col items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900/70 p-10 text-center">
            <div className="text-4xl">🔍</div>

            <p className="mt-4 text-base font-semibold text-white">
              No results found
            </p>

            <p className="mt-1 text-sm text-zinc-400">
              Try a different keyword.
            </p>
          </section>
        ) : (
          <ExploreCreatorGrid creators={creators} />
        )
      ) : (
        <ExplorePostGrid posts={posts} />
      )}
    </main>
  )
}