import Link from "next/link"
import { redirect } from "next/navigation"

import { getSession } from "@/modules/auth/server/get-session"
import { listLikedPosts } from "@/modules/post/server/list-liked-posts"

type LikedPost = {
  id: string
  contentPreview: string
  createdAt: string
  creator: {
    username: string
    displayName: string
  }
  mediaThumbnailUrl: string | null
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function getSessionUserId(session: unknown) {
  if (!session || typeof session !== "object") {
    return null
  }

  if ("userId" in session && typeof session.userId === "string") {
    return session.userId
  }

  if (
    "user" in session &&
    session.user &&
    typeof session.user === "object" &&
    "id" in session.user &&
    typeof session.user.id === "string"
  ) {
    return session.user.id
  }

  return null
}

function getStringValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === "string" && value.length > 0) {
      return value
    }
  }

  return null
}

function normalizeLikedPost(item: unknown, index: number): LikedPost | null {
  if (!item || typeof item !== "object") {
    return null
  }

  const source = item as Record<string, unknown>

  const id =
    getStringValue(source, ["postId", "id"]) ?? `post_${index + 1}`

  const createdAt =
    getStringValue(source, ["createdAt", "created_at", "likedAt", "liked_at"]) ??
    new Date().toISOString()

  const contentPreview =
    getStringValue(source, ["contentPreview", "content", "text"]) ?? ""

  const username =
    getStringValue(source, [
      "creatorUsername",
      "username",
      "creator_username",
    ]) ?? "unknown"

  const displayName =
    getStringValue(source, [
      "creatorDisplayName",
      "displayName",
      "creator_display_name",
      "name",
    ]) ?? "Unknown creator"

  const mediaThumbnailUrl = getStringValue(source, [
    "mediaThumbnailUrl",
    "thumbnailUrl",
    "thumbnail_url",
    "media_thumbnail_url",
  ])

  return {
    id,
    contentPreview,
    createdAt,
    creator: {
      username,
      displayName,
    },
    mediaThumbnailUrl,
  }
}

function normalizeLikedPosts(data: unknown) {
  if (!Array.isArray(data)) {
    return []
  }

  return data
    .map((item, index) => normalizeLikedPost(item, index))
    .filter((item): item is LikedPost => item !== null)
}

export default async function LikesPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const userId = getSessionUserId(session)

  if (!userId) {
    redirect("/login")
  }

  const likedPostsData = await listLikedPosts(userId)
  const likedPosts = normalizeLikedPosts(likedPostsData)

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
            Post
          </p>
          <h1 className="text-3xl font-semibold text-white">Liked posts</h1>
          <p className="text-sm text-zinc-400">
            Posts you liked are collected here.
          </p>
        </div>

        {likedPosts.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 p-12 text-center">
            <h2 className="text-2xl font-semibold text-white">
              No liked posts
            </h2>
            <p className="mt-3 text-sm text-zinc-400">
              Posts you like will appear here.
            </p>
            <Link
              href="/feed"
              className="mt-6 inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              Browse feed
            </Link>
          </section>
        ) : (
          <section className="grid gap-4">
            {likedPosts.map((post) => (
              <article
                key={post.id}
                className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-2xl shadow-black/20"
              >
                <div className="grid gap-5 md:grid-cols-[160px_minmax(0,1fr)]">
                  <div className="flex h-36 items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/60 text-sm text-zinc-500">
                    {post.mediaThumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.mediaThumbnailUrl}
                        alt="thumbnail"
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