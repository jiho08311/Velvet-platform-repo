"use server"
import type {
  CreatePostUploadedMediaInput,
  PostBlockEditorState,
} from "../types"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createPostWithMediaWorkflow } from "@/workflows/create-post-with-media-workflow"
import { localDateTimeToUtcIso } from "@/shared/lib/date-time"

type UploadedFileInput = {
  path: string
  type: string
  mimeType: string
  size: number
  originalName: string
}

type CreatePostActionInput = {
  creatorId: string
  text?: string
  status?: "draft" | "scheduled" | "published"
  publishedAt?: string | null
  visibility: "public" | "subscribers" | "paid"
  price?: number
  files?: UploadedFileInput[]
  blocks?: {
    type: "text" | "image" | "video" | "audio" | "file"
    content?: string | null
    sortOrder: number
    mediaId?: string | null
    editorState?: PostBlockEditorState
  }[]
}

export async function createPostAction({
  creatorId,
  text = "",
  status = "published",
  publishedAt = null,
  visibility,
  price = 0,
  files = [],
  blocks = [],
}: CreatePostActionInput): Promise<void> {
  const normalizedText = text.trim()
  const hasMedia = files.length > 0
  const hasBlocks = blocks.length > 0

  if (!normalizedText && !hasMedia && !hasBlocks) {
    throw new Error("Post must have text or media")
  }

  if (visibility === "paid" && price <= 0) {
    throw new Error("Paid post price must be greater than 0")
  }

  const normalizedPublishedAt =
    status === "scheduled" ? localDateTimeToUtcIso(publishedAt) : null

  if (status === "scheduled" && !normalizedPublishedAt) {
    throw new Error("Scheduled post requires valid publishedAt")
  }

  try {
 const blocks =
  normalizedText || files.length > 0
    ? [
        ...(normalizedText
          ? [
              {
                type: "text" as const,
                content: normalizedText,
                sortOrder: 0,
              },
            ]
          : []),
        ...files.map((file, index) => ({
          type: file.type as "image" | "video" | "audio" | "file",
          sortOrder: normalizedText ? index + 1 : index,
        })),
      ]
    : []

await createPostWithMediaWorkflow({
  creatorId,
  content: null,
  visibility,
  price: visibility === "paid" ? price : 0,
  files,
  blocks,
})
  } catch (error) {
    console.error("[createPostAction]", error)

    if (error instanceof Error) {
      throw new Error(`DEBUG: ${error.message}`)
    }

    throw new Error("DEBUG: Failed to create post")
  }

  revalidatePath("/feed")
  revalidatePath("/post/new")
  revalidatePath(`/creator/${creatorId}`)
  revalidatePath("/profile")

  redirect("/profile")
}