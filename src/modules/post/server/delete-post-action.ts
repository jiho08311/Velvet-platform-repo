"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { deletePost } from "@/modules/post/server/delete-post"

export async function deletePostAction(postId: string) {
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/sign-in?next=/post/${postId}`)
  }

  const creator = await getCreatorByUserId(user.id)

  if (!creator) {
    throw new Error("Creator not found")
  }

  await deletePost({
    postId,
    creatorId: creator.id,
  })

  revalidatePath(`/post/${postId}`)
  revalidatePath(`/creator/${creator.username}`)
  revalidatePath("/profile")

  redirect("/profile")
}