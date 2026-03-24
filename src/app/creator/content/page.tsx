import { getSession } from "@/modules/auth/server/get-session"
import { CreatorPostList } from "@/modules/post/ui/CreatorPostList"
import { getMyPosts } from "@/modules/post/server/get-my-posts"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"

export default async function CreatorContentPage() {
  const session = await getSession()

  if (!session) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
        <section className="rounded-2xl border border-white/10 bg-neutral-950 p-8 text-center text-sm text-white/60">
          Sign in to manage your content.
        </section>
      </main>
    )
  }

  const creator = await getCreatorByUserId(session.userId)

  if (!creator) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
        <section className="rounded-2xl border border-white/10 bg-neutral-950 p-8 text-center text-sm text-white/60">
          Creator access is required to view this page.
        </section>
      </main>
    )
  }

  const result = await getMyPosts({
    creatorId: creator.id,
    limit: 20,
  })

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
      <section className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Content</h1>
          <p className="mt-1 text-sm text-white/60">
            Manage your posts and visibility.
          </p>
        </div>
      </section>

      <CreatorPostList
        posts={result.items.map((post) => ({
          id: post.id,
          text: post.text,
          createdAt: post.publishedAt ?? post.createdAt,
          isLocked: post.visibility !== "public",
          previewText: post.text,
        }))}
        isSubscribed
        emptyMessage="You have not created any posts yet."
      />
    </main>
  )
}