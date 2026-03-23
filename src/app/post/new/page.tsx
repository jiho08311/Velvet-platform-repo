import { redirect } from "next/navigation"

import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { CreatePostComposer } from "@/modules/post/ui/CreatePostComposer"

export default async function NewPostPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in?next=/post/new")
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
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">
        Create new post
      </h1>

      <CreatePostComposer creatorId={creator.id} />
    </main>
  )
}