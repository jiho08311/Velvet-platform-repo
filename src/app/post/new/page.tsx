import { redirect } from "next/navigation"

import {
  assertPassVerified,
  getPassVerificationRedirectPath,
} from "@/modules/auth/server/assert-pass-verified"
import { requireCreatorReadyUser } from "@/modules/creator/server/require-creator-ready-user"
import { CreatePostComposer } from "@/modules/post/ui/CreatePostComposer"

export default async function NewPostPage() {
  const nextPath = "/post/new"
  const { user, creator } = await requireCreatorReadyUser({
    signInNext: nextPath,
  })

  try {
    await assertPassVerified({ profileId: user.id })
  } catch {
    redirect(getPassVerificationRedirectPath({ next: nextPath }))
  }

  return (
    <main className="w-full px-0 py-8">
      <div className="mb-6 space-y-2 px-0">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-pink-400">
          Create
        </p>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">
          Start a new post
        </h1>
        <p className="text-sm leading-6 text-zinc-400 sm:text-base">
          Write naturally, mix text with media, and build the post in the order
          you want your fans to see it.
        </p>
      </div>

      <CreatePostComposer creatorId={creator.id} />
    </main>
  )
}
