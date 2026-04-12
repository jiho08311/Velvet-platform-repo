import Link from "next/link"
import { redirect } from "next/navigation"

import { assertPassVerified } from "@/modules/auth/server/assert-pass-verified"
import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { CreateStoryComposer } from "@/modules/story/ui/CreateStoryComposer"

export default async function NewStoryPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in?next=/story/new")
  }

  try {
    await assertPassVerified({ profileId: user.id })
  } catch {
    redirect("/verify-pass")
  }

  const creator = await getCreatorByUserId(user.id)

  if (!creator) {
    return (
      <main className="w-full min-h-screen px-0 py-0 md:mx-auto md:max-w-3xl md:px-4 md:py-8">
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Only creators can create stories.
        </div>
      </main>
    )
  }

  return (
    <main className="w-full min-h-screen px-0 py-0 md:mx-auto md:max-w-3xl md:px-4 md:py-8">
      <div className="px-4 py-6 md:px-0 md:py-0">
        <div className="mb-4">
          <Link
            href="/feed"
            className="text-sm text-zinc-400 hover:text-white"
          >
            ← Back to feed
          </Link>
        </div>

        <div className="mb-8 space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-pink-400">
            Create
          </p>

          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            New story
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
            Share a quick moment with photo or video. Stories disappear after 24
            hours and can be visible to everyone or just your subscribers.
          </p>
        </div>

        <CreateStoryComposer />

        <div className="mt-6 space-y-1 text-xs text-zinc-500">
          <p>• Stories are visible for 24 hours</p>
          <p>• Videos may be trimmed and processed automatically</p>
          <p>• Choose visibility before publishing</p>
        </div>
      </div>
    </main>
  )
}