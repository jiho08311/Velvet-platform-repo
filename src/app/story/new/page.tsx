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
      <main className="min-h-screen bg-zinc-950">
        <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
          <div className="w-full rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            Only creators can create stories.
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="flex min-h-screen w-full items-stretch">
        <div className="w-full px-0 py-0">
          <CreateStoryComposer />
        </div>
      </div>
    </main>
  )
}