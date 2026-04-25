import { redirect } from "next/navigation"

import { getSession } from "@/modules/auth/server/get-session"
import {
  buildPathWithNext,
  SIGN_IN_PATH,
} from "@/modules/auth/lib/redirect-handoff"

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

export default async function CreatorMediaPage() {
  const nextPath = "/creator/media"
  const session = await getSession()

  if (!session) {
    redirect(
      buildPathWithNext({
        path: SIGN_IN_PATH,
        next: nextPath,
      })
    )
  }

  const userId = getSessionUserId(session)

  if (!userId) {
    redirect(
      buildPathWithNext({
        path: SIGN_IN_PATH,
        next: nextPath,
      })
    )
  }

  const mediaItems: Array<{
    id: string
    type: "image" | "video" | "audio"
    createdAt: string
    thumbnailUrl: string | null
  }> = []

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
              Creator
            </p>
            <h1 className="text-3xl font-semibold text-white">Media library</h1>
            <p className="text-sm text-zinc-400">
              Manage your uploaded media assets in one place.
            </p>
          </div>

          <button
            type="button"
            className="rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
          >
            Upload media
          </button>
        </div>

        {mediaItems.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 p-12 text-center">
            <h2 className="text-2xl font-semibold text-white">No media yet</h2>
            <p className="mt-3 text-sm text-zinc-400">
              Uploaded media will appear here once you add content.
            </p>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" />
        )}
      </div>
    </main>
  )
}
