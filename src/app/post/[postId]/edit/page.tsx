import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { getCreatorStudioPost } from "@/modules/post/server/get-creator-studio-post"

type EditPostPageProps = {
  params: Promise<{
    postId: string
  }>
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { postId } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/sign-in?next=/post/${postId}/edit`)
  }

  const creator = await getCreatorByUserId(user.id)

  if (!creator) {
    notFound()
  }

  const post = await getCreatorStudioPost({
    postId,
    creatorId: creator.id,
  })

  if (!post) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        <Link
          href={`/post/${postId}`}
          className="inline-flex w-fit items-center rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
        >
          ← Back to post
        </Link>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
          <h1 className="text-xl font-semibold text-white">Edit post</h1>

          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
            <p className="text-sm text-zinc-300">
              Edit page is temporarily unavailable.
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              This route is intentionally disabled for now so production build can
              pass safely.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/post/${postId}`}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Back to post
            </Link>

            <Link
              href="/profile"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 px-5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
            >
              Go to profile
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}