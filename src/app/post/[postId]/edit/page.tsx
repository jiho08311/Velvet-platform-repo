import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { getCreatorStudioPost } from "@/modules/post/server/get-creator-studio-post"
import { updatePostAction } from "@/modules/post/server/update-post-action"

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

  async function submitAction(formData: FormData) {
    "use server"

    const text = String(formData.get("text") ?? "")
    const rawPrice = Number(formData.get("priceCents") ?? 0)

    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File && value.size > 0)

    const removedMediaIds = formData
      .getAll("removedMediaIds")
      .filter((value): value is string => typeof value === "string" && value.length > 0)

    await updatePostAction({
      postId,
      text,
   visibility: fixedVisibility,
      priceCents: Number.isFinite(rawPrice) ? rawPrice : 0,
      files,
      removedMediaIds,
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

          <form action={submitAction} className="mt-5 space-y-5">
            <textarea
              name="text"
              defaultValue={post.content ?? ""}
              rows={10}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
              placeholder="Write something..."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-zinc-400">Visibility</span>
                <select
                  value={post.visibility}
                  disabled
                  className="h-11 w-full cursor-not-allowed rounded-2xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-500 outline-none opacity-70"
                >
                  <option value="public">Public</option>
                  <option value="subscribers">Subscribers</option>
                  <option value="paid">Paid</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm text-zinc-400">Price (paid only)</span>
                <select
                  name="priceCents"
                  defaultValue={String(post.priceCents > 0 ? post.priceCents : 4900)}
                  disabled={post.visibility !== "paid"}
                  className="h-11 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:text-zinc-500 disabled:opacity-70"
                >
                  <option value={4900}>₩4,900</option>
                  <option value={9900}>₩9,900</option>
                  <option value={15900}>₩15,900</option>
                  <option value={19900}>₩19,900</option>
                </select>
              </label>
            </div>

            {post.media.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-zinc-400">Existing media</p>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {post.media.map((media) => (
                    <label
                      key={media.id}
                      className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950"
                    >
                      <div className="aspect-square overflow-hidden bg-zinc-900">
                        {media.type === "video" ? (
                          <video
                            src={media.url}
                            muted
                            playsInline
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <img
                            src={media.url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-3 border-t border-zinc-800 px-3 py-2">
                        <span className="text-xs text-zinc-400">Remove</span>
                        <input
                          type="checkbox"
                          name="removedMediaIds"
                          value={media.id}
                          className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-[#C2185B] focus:ring-[#C2185B]"
                        />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            <label className="block space-y-2">
              <span className="text-sm text-zinc-400">Add files</span>
              <input
                name="files"
                type="file"
                multiple
                className="block w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-zinc-300 file:mr-3 file:rounded-full file:border-0 file:bg-[#C2185B] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#D81B60]"
              />
              <p className="text-xs text-zinc-500">
                Removed media will be deleted. Newly selected files will be added.
              </p>
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#C2185B] px-5 text-sm font-medium text-white transition hover:bg-[#D81B60] active:bg-[#AD1457]"
              >
                Save changes
              </button>

              <Link
                href={`/post/${postId}`}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Cancel
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}