import Link from "next/link"
import { notFound } from "next/navigation"

import { requireUser } from "@/modules/auth/server/require-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { listCreatorStudioPosts } from "@/modules/post/server/list-creator-studio-posts"

async function deletePostAction(postId: string) {
  "use server"

  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/post/${postId}/delete`, {
    method: "POST",
  })
}

export default async function CreatorStudioPage() {
  const user = await requireUser()
  const creator = await getCreatorByUserId(user.id)

  if (!creator) {
    notFound()
  }

  const posts = await listCreatorStudioPosts({
    creatorId: creator.id,
  })

  const draftCount = posts.filter((post) => post.status === "draft").length
  const publishedCount = posts.filter((post) => post.status === "published").length
  const archivedCount = posts.filter((post) => post.status === "archived").length

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-neutral-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-white/50">Creator Studio</p>
          <h1 className="text-3xl font-semibold">Manage your content</h1>
          <p className="text-sm text-white/60">
            Manage your draft, published, and archived posts.
          </p>
        </div>

        <Link
          href="/creator/studio/posts/new"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-medium text-black transition hover:bg-white/90"
        >
          New Post
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-neutral-950 p-5 text-white">
          <p className="text-sm text-white/50">Draft posts</p>
          <p className="mt-2 text-2xl font-semibold">{draftCount}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-950 p-5 text-white">
          <p className="text-sm text-white/50">Published posts</p>
          <p className="mt-2 text-2xl font-semibold">{publishedCount}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-950 p-5 text-white">
          <p className="text-sm text-white/50">Archived posts</p>
          <p className="mt-2 text-2xl font-semibold">{archivedCount}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-950">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 text-white">
          <div>
            <h2 className="text-lg font-semibold">Posts</h2>
            <p className="mt-1 text-sm text-white/50">
              Edit or delete your existing content.
            </p>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-white/60">
            No posts yet. Create your first post.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1.5fr_140px_160px_180px] gap-4 border-b border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/50">
              <span>Post</span>
              <span>Status</span>
              <span>Created</span>
              <span>Actions</span>
            </div>

            <ul className="divide-y divide-white/10">
              {posts.map((post) => (
                <li
                  key={post.id}
                  className="grid grid-cols-[1.5fr_140px_160px_180px] gap-4 px-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {post.title || "Untitled post"}
                    </p>

                    {post.content ? (
                      <p className="mt-1 line-clamp-2 text-sm text-white/60">
                        {post.content}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-start">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                        post.status === "draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : post.status === "published"
                            ? "bg-green-100 text-green-800"
                            : "bg-neutral-200 text-neutral-700"
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>

                  <div className="flex items-start text-xs text-white/60">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </div>

                  <div className="flex items-start gap-2">
                    <Link
                      href={`/creator/studio/posts/${post.id}/edit`}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-white/10 px-3 text-sm font-medium text-white/80 transition hover:bg-white/5"
                    >
                      Edit
                    </Link>

                    <form action={deletePostAction.bind(null, post.id)}>
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-red-400/20 px-3 text-sm font-medium text-red-300 transition hover:bg-red-400/10"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  )
}