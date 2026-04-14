import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { getCreatorStudioPost } from "@/modules/post/server/get-creator-studio-post"
import { updatePostAction } from "@/modules/post/server/update-post-action"
import { CreatePostForm } from "@/modules/post/ui/CreatePostForm"

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

  const fixedVisibility = post.visibility

  async function submitAction(input: {
    visibility: "public" | "subscribers"
    files: File[]
    blocks: {
      type: "text" | "image" | "video" | "audio" | "file"
      content?: string | null
      sortOrder: number
    }[]
  }) {
    "use server"

    await updatePostAction({
      postId,
      text: "",
      visibility: fixedVisibility,
      files: input.files,
      removedMediaIds: [],
  blocks: input.blocks,
    })
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <Link
          href={`/post/${postId}`}
          className="inline-flex w-fit items-center rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
        >
          ← Back to post
        </Link>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6">
          <h1 className="text-xl font-semibold text-white">Edit post</h1>

          <div className="mt-5 space-y-5">

<CreatePostForm
  isSubmitting={false}
  initialBlocks={post.blocks
.filter(
  (
    b
  ): b is {
    id: string
    postId: string
    type: "text" | "image" | "video"
    content: string | null
    mediaId: string | null
    sortOrder: number
    createdAt: string
    editorState: import("@/modules/post/types").PostBlockEditorState
  } => b.type === "text" || b.type === "image" || b.type === "video"
)
    .map((b) => ({
      type: b.type,
      content: b.content,
      mediaId: b.mediaId,
      url:
        b.type !== "text"
          ? post.media.find((m) => m.id === b.mediaId)?.url ?? null
          : null,
          editorState: b.editorState ?? null,
    }))}
  initialVisibility={
    fixedVisibility === "public" ? "public" : "subscribers"
  }
  onSubmitPost={submitAction}
/>


            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/post/${postId}`}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Cancel
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}