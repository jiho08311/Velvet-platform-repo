import { redirect } from "next/navigation"

import {
  assertPassVerified,
  getPassVerificationRedirectPath,
} from "@/modules/auth/server/assert-pass-verified"
import { requireCreatorReadyUser } from "@/modules/creator/server/require-creator-ready-user"
import { CreateStoryComposer } from "@/modules/story/ui/CreateStoryComposer"

export default async function NewStoryPage() {
  const nextPath = "/story/new"
  const { user } = await requireCreatorReadyUser({
    signInNext: nextPath,
  })

  try {
    await assertPassVerified({ profileId: user.id })
  } catch {
    redirect(getPassVerificationRedirectPath({ next: nextPath }))
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
