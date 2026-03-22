import Link from "next/link"
import { notFound } from "next/navigation"

import { requireUser } from "@/modules/auth/server/require-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"

export default async function NewPostPage() {
  const user = await requireUser()
  const creator = await getCreatorByUserId(user.id)

  if (!creator) {
    notFound()
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      <section className="rounded-2xl border border-white/10 bg-neutral-950 p-6 text-white">
        <p className="text-sm text-white/50">Creator Studio</p>
        <h1 className="mt-1 text-2xl font-semibold">Create new post</h1>
        <p className="mt-2 text-sm text-white/60">
          Write a new post for your audience.
        </p>
      </section>

      <form
        action="/api/posts"
        method="post"
        encType="multipart/form-data"
        className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-neutral-950 p-6 text-white"
      >
        <div className="grid gap-2">
          <label htmlFor="content" className="text-sm font-medium text-white/80">
            Content
          </label>
          <textarea
            id="content"
            name="content"
            rows={8}
            placeholder="Write your post..."
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="media" className="text-sm font-medium text-white/80">
            Media
          </label>
          <div className="rounded-2xl border border-dashed border-white/10 p-6">
            <input
              id="media"
              name="media"
              type="file"
              multiple
              className="block w-full text-sm text-white/70 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-black"
            />
            <p className="mt-3 text-xs text-white/40">
              Upload image or video files.
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor="visibility" className="text-sm font-medium text-white/80">
              Visibility
            </label>
            <select
              id="visibility"
              name="visibility"
              defaultValue="public"
              className="h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none"
            >
              <option value="public">public</option>
              <option value="subscribers">subscribers</option>
              <option value="paid">paid</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label htmlFor="status" className="text-sm font-medium text-white/80">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue="draft"
              className="h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none"
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
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
            Create post
          </button>
        </div>
      </form>
    </main>
  )
}