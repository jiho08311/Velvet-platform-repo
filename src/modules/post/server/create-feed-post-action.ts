"use server"

import { revalidatePath } from "next/cache"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"

import { createPostWithMediaWorkflow } from "@/workflows/create-post-with-media-workflow"
import type {
  CreatePostBlockInput,
  CreatePostUploadedMediaInput,
} from "@/modules/post/types"

type Input = {
  text: string
  visibility: "public" | "subscribers"
  userId: string
  files?: CreatePostUploadedMediaInput[]
}

function buildQuickCreateBlocks(params: {
  text: string
  files: CreatePostUploadedMediaInput[]
}): CreatePostBlockInput[] {
  const trimmedText = params.text.trim()
  const blocks: CreatePostBlockInput[] = []

  if (trimmedText) {
    blocks.push({
      type: "text",
      content: trimmedText,
      sortOrder: 0,
    })
  }

  params.files.forEach((file, index) => {
    blocks.push({
      type: file.type as "image" | "video" | "audio" | "file",
      sortOrder: trimmedText ? index + 1 : index,
    })
  })

  return blocks
}

export async function createFeedPostAction({
  text,
  visibility,
  userId,
  files = [],
}: Input) {
  const normalizedText = text.trim()
  const hasMedia = files.length > 0

  if (!normalizedText && !hasMedia) {
    throw new Error("Empty post")
  }

  const creator = await getCreatorByUserId(userId)

  if (!creator) {
    throw new Error("Creator not found")
  }

  const blocks = buildQuickCreateBlocks({
    text: normalizedText,
    files,
  })

  await createPostWithMediaWorkflow({
    creatorId: creator.id,
    content: null,
    visibility,
    price: 0,
    status: "published",
    files,
    blocks,
  })

  revalidatePath("/feed")
}