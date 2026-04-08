import { redirect } from "next/navigation"

import { assertPassVerified } from "@/modules/auth/server/assert-pass-verified"
import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { CreatePostComposer } from "@/modules/post/ui/CreatePostComposer"

export default async function NewPostPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in?next=/post/new")
  }

  try {
    await assertPassVerified({ profileId: user.id })
  } catch {
    redirect("/verify-pass")
  }

  const creator = await getCreatorByUserId(user.id)

  if (!creator) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-500">
          Only creators can create posts.
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
    

      <CreatePostComposer creatorId={creator.id} />
    </main>
  )
}