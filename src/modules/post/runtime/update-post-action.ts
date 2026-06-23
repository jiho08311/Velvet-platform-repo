"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import type { CreatePostClientDraftBlock } from "../types"
import { getCurrentUser } from "@/modules/auth/public/get-current-user"
import { getCreatorByUserId } from "@/modules/creator/public/get-creator-by-user-id"
import { getCreatorStudioPost } from "@/modules/post/runtime/get-creator-studio-post"
import { buildEditPostPlan } from "@/modules/post/services/post-edit-service"
import { executeUpdatePostUseCase } from "@/modules/post/use-cases/update-post"

type UpdatePostActionInput = {
  postId: string
  visibility: "public" | "subscribers" | "paid"
  price?: number
  files?: File[]
  blocks?: CreatePostClientDraftBlock[]
}

export async function updatePostAction({
  postId,
  visibility: _visibility,
  price = 0,
  files = [],
  blocks = [],
}: UpdatePostActionInput) {
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/sign-in?next=/post/${postId}/edit`)
  }

  const creator = await getCreatorByUserId(user.id)

  if (!creator) {
    throw new Error("Creator not found")
  }

  const currentPost = await getCreatorStudioPost({
    postId,
    creatorId: creator.id,
  })

  if (!currentPost) {
    throw new Error("Post not found")
  }

  const editPlan = buildEditPostPlan({
    currentBlocks: currentPost.blocks,
    nextBlocks: blocks,
    files,
    price,
    visibility: currentPost.visibility,
    currentStatus: currentPost.status,
  })

  await executeUpdatePostUseCase({
    postId,
    creatorId: creator.id,
    userId: user.id,
    currentPost,
    plan: editPlan,
  })

  revalidatePath("/feed")
  revalidatePath(`/post/${postId}`)
  revalidatePath(`/post/${postId}/edit`)
  revalidatePath(`/creator/${creator.username}`)
  revalidatePath("/profile")

  redirect(`/post/${postId}`)
}