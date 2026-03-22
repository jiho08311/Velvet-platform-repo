import Link from "next/link"
import { notFound } from "next/navigation"

import { requireUser } from "@/modules/auth/server/require-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { getCreatorStudioPost } from "@/modules/post/server/get-creator-studio-post"

type CreatorStudioEditPostPageProps = {
  params: Promise<{
    postId: string
  }>
}

export default async function CreatorStudioEditPostPage({
  params,
}: CreatorStudioEditPostPageProps) {
  const { postId } = await params

  const user = await requireUser()
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
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="rounded-2xl border border-white/10 bg-neutral-950 p-6 text-white">
        <p className="text-sm text-white/50">Creator Studio</p>
        <h1 className="mt-1 text-3xl font-semibold">Edit Post</h1>
        <p className="mt-2 text-sm text-white/60">
          Update your draft, published, or archived post.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-neutral-950 p-6 text-white">
        <form
          action={`/api/post/${post.id}/update`}
          method="post"
          encType="multipart/form-data"
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <label
              htmlFor="title"
              className="text-sm font-medium text-white/80"
            >
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              defaultValue={post.title ?? ""}
              placeholder="Optional title"
              className="h-11 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/30"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="content"
              className="text-sm font-medium text-white/80"
            >
              Content
            </label>
            <textarea
              id="content"
              name="content"
              rows={8}
              defaultValue={post.content ?? ""}
              placeholder="Update your post..."
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/80">Media</label>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-white/40">
                Media thumbnail placeholder
              </div>

              <div className="mt-4">
                <input
                  id="media"
                  name="media"
                  type="file"
                  multiple
                  className="block w-full text-sm text-white/70 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-black"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="status"
                className="text-sm font-medium text-white/80"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={post.status}
                className="h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none"
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="archived">archived</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="visibility"
                className="text-sm font-medium text-white/80"
              >
                Visibility
              </label>
              <select
                id="visibility"
                name="visibility"
                defaultValue={post.visibility}
                className="h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none"
              >
                <option value="public">public</option>
                <option value="subscribers">subscribers</option>
                <option value="paid">paid</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Link
              href="/creator/studio"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-medium text-white/80 transition hover:bg-white/5"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-medium text-black transition hover:bg-white/90"
            >
              Save
            </button>
          </div>
        </form>

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