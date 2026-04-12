"use server"

import { revalidatePath } from "next/cache"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { createPostWithMediaWorkflow } from "@/workflows/create-post-with-media-workflow"

type UploadedFileInput = {
  path: string
  type: string
  mimeType: string
  size: number
  originalName: string
}

type Input = {
  text: string
  visibility: "public" | "subscribers"
  userId: string
  files?: UploadedFileInput[]
}

export async function createFeedPostAction({
  text,
  visibility,
  userId,
  files = [],
}: Input) {
  const content = text.trim()
  const hasMedia = files.length > 0

  if (!content && !hasMedia) {
    throw new Error("Empty post")
  }

  const creator = await getCreatorByUserId(userId)

  if (!creator) {
    throw new Error("Creator not found")
  }

  await createPostWithMediaWorkflow({
    creatorId: creator.id,
    content: content || null,
    visibility,
    price: 0,
    status: "published",
    files,
    blocks: [],
  })

  revalidatePath("/feed")
}