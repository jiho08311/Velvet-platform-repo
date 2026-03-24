import { getSession } from "@/modules/auth/server/get-session"
import { getUserById } from "@/modules/user/server/get-user-by-id"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"

export default async function NewCreatorPostPage() {
  const session = await getSession()

  if (!session) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        <section className="rounded-2xl border border-white/10 bg-neutral-950 p-8 text-center text-sm text-white/60">
          Sign in to create a new post.
        </section>
      </main>
    )
  }

  const user = await getUserById(session.userId)

  if (!user) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        <section className="rounded-2xl border border-white/10 bg-neutral-950 p-8 text-center text-sm text-white/60">
          Creator access is required to create a post.
        </section>
      </main>
    )
  }

  const creator = await getCreatorByUserId(user.id)

  if (!creator) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        <section className="rounded-2xl border border-white/10 bg-neutral-950 p-8 text-center text-sm text-white/60">
          Creator access is required to create a post.
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      <section>
        <h1 className="text-xl font-semibold text-white">New post</h1>
        <p className="mt-1 text-sm text-white/60">
          Write and publish content for your subscribers.
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-neutral-950 p-5">
        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="post-text"
              className="text-sm font-medium text-white/80"
            >
              Post text
            </label>
            <textarea
              id="post-text"
              name="text"
              rows={8}
              placeholder="Write something for your audience..."
              className="min-h-[220px] w-full resize-none rounded-2xl border border-white/10 bg-neutral-900 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <p className="text-sm text-white/55">Ready to publish this post.</p>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white px-5 text-sm font-medium text-black transition hover:bg-white/90"
            >
              Publish
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}