import Link from "next/link"
import { notFound } from "next/navigation"

import { requireCreatorReadyUser } from "@/modules/creator/server/require-creator-ready-user"
import { getCreatorStudioPost } from "@/modules/post/server/get-creator-studio-post"
import { EditPostComposer } from "@/modules/post/ui/EditPostComposer"

type CreatorStudioEditPostPageProps = {
  params: Promise<{
    postId: string
  }>
}

export default async function CreatorStudioEditPostPage({
  params,
}: CreatorStudioEditPostPageProps) {
  const { postId } = await params

  const { creator } = await requireCreatorReadyUser({
    signInNext: `/creator/studio/posts/${postId}/edit`,
  })

  const post = await getCreatorStudioPost({
    postId,
    creatorId: creator.id,
  })

  if (!post) {
    notFound()
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="rounded-2xl border border-white/10 bg-neutral-950 p-6 text-white">
        <p className="text-sm text-white/50">Creator Studio</p>
        <h1 className="mt-1 text-3xl font-semibold">Edit Post</h1>
        <p className="mt-2 text-sm text-white/60">
          Update your draft, published, or archived post.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-neutral-950 p-6 text-white">
        <div className="mb-6 flex items-center justify-end">
          <Link
            href="/creator/studio"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-medium text-white/80 transition hover:bg-white/5"
          >
            Cancel
          </Link>
        </div>

        <EditPostComposer
          postId={post.id}
          initialBlocks={post.blocks}
          initialVisibility={post.visibility}
        />

        <div className="mt-6 border-t border-white/10 pt-6">
          <form action={`/api/post/${post.id}/delete`} method="post">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-red-400/20 px-4 text-sm font-medium text-red-300 transition hover:bg-red-400/10"
            >
              Delete
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
