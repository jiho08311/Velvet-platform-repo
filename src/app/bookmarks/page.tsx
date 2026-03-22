import Link from "next/link"
import { getSession } from "@/modules/auth/server/get-session"
import { listBookmarkedPosts } from "@/modules/post/server/list-bookmarked-posts"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export default async function BookmarksPage() {
  const session = await getSession()

  if (!session) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
          <div className="flex flex-col gap-2">
            <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
              Post
            </p>
            <h1 className="text-3xl font-semibold text-white">Bookmarks</h1>
            <p className="text-sm text-zinc-400">
              Saved posts will appear here for quick access.
            </p>
          </div>

          <section className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 p-12 text-center">
            <h2 className="text-2xl font-semibold text-white">
              Sign in to view bookmarks
            </h2>
            <p className="mt-3 text-sm text-zinc-400">
              Your saved posts will appear here after you sign in.
            </p>
            <Link
              href="/feed"
              className="mt-6 inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              Go to feed
            </Link>
          </section>
        </div>
      </main>
    )
  }

  const bookmarkedPosts = await listBookmarkedPosts({
    userId: session.userId,
  })

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
            Post
          </p>
          <h1 className="text-3xl font-semibold text-white">Bookmarks</h1>
          <p className="text-sm text-zinc-400">
            Saved posts will appear here for quick access.
          </p>
        </div>

        {bookmarkedPosts.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 p-12 text-center">
            <h2 className="text-2xl font-semibold text-white">
              No bookmarked posts
            </h2>
            <p className="mt-3 text-sm text-zinc-400">
              Posts you save will show up here.
            </p>
            <Link
              href="/feed"
              className="mt-6 inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              Go to feed
            </Link>
          </section>
        ) : (
          <section className="grid gap-4">
            {bookmarkedPosts.map((post) => (
              <article
                key={post.id}
                className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-2xl shadow-black/20"
              >
                <div className="grid gap-5 md:grid-cols-[160px_minmax(0,1fr)]">
                  <div className="flex h-36 items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/60 text-sm text-zinc-500">
                    {post.mediaThumbnailUrl ? (
                      <img
                        src={post.mediaThumbnailUrl}
                        alt={post.creator.displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      "Media thumbnail"
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-white">
                          {post.creator.displayName}
                        </p>
                        <span className="text-sm text-zinc-500">•</span>
                        <p className="text-sm text-zinc-400">
                          @{post.creator.username}
                        </p>
                      </div>

                      <p className="mt-2 text-sm text-zinc-500">
                        {formatDate(post.createdAt)}
                      </p>
                    </div>

                    <p className="line-clamp-3 text-sm leading-7 text-zinc-200">
                      {post.contentPreview}
                    </p>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/post/${post.id}`}
                        className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
                      >
                        View post
                      </Link>

                      <Link
                        href={`/creator/${post.creator.username}`}
                        className="inline-flex items-center rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900"
                      >
                        View creator
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}