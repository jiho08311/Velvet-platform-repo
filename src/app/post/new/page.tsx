import { redirect } from "next/navigation"

import { assertPassVerified } from "@/modules/auth/server/assert-pass-verified"
import { readOnboardingReadiness } from "@/modules/auth/server/read-onboarding-readiness"
import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { CreatePostComposer } from "@/modules/post/ui/CreatePostComposer"

export default async function NewPostPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in?next=/post/new")
  }

  const readiness = await readOnboardingReadiness({
    userId: user.id,
  })

  if (!readiness.ok) {
    redirect("/onboarding")
  }

  try {
    await assertPassVerified({ profileId: user.id })
  } catch {
    redirect("/verify-pass")
  }

  const creator = await getCreatorByUserId(user.id)

  if (!creator) {
    return (
      <main className="w-full px-0 py-8">
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Only creators can create posts.
        </div>
      </main>
    )
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