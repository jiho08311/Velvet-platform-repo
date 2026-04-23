"use server"

import { revalidatePath } from "next/cache"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"

import { createPostWithMediaWorkflow } from "@/workflows/create-post-with-media-workflow"
import type {
  CreatePostUploadedMediaInput,
} from "@/modules/post/types"
import { normalizeFeedCreatePostDraftIntent } from "@/modules/post/server/normalize-create-post-draft"

type Input = {
  text: string
  visibility: "public" | "subscribers"
  userId: string
  files?: CreatePostUploadedMediaInput[]
}

export async function createFeedPostAction({
  text,
  visibility,
  userId,
  files = [],
}: Input) {
  const creator = await getCreatorByUserId(userId)

  if (!creator) {
    throw new Error("Creator not found")
  }

  const draftIntent = normalizeFeedCreatePostDraftIntent({
    creatorId: creator.id,
    text,
    visibility,
    files,
  })

  await createPostWithMediaWorkflow(draftIntent)

  revalidatePath("/feed")
}
