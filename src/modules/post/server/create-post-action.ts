"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { PostBlockEditorState } from "../types"
import { createPostWithMediaWorkflow } from "@/workflows/create-post-with-media-workflow"

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

function normalizeUtcIsoString(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
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
  const firstTextBlock = blocks.find(
    (block) =>
      block.type === "text" &&
      (block.content?.trim() ?? "").length > 0
  )

  const content =
    text?.trim() ||
    firstTextBlock?.content?.trim() ||
    ""

  const hasMedia = files.length > 0
  const hasBlocks = blocks.length > 0

  if (!content && !hasMedia && !hasBlocks) {
    throw new Error("Post must have text or media")
  }

  if (visibility === "paid" && price <= 0) {
    throw new Error("Paid post price must be greater than 0")
  }

  const normalizedPublishedAt =
    status === "scheduled" ? normalizeUtcIsoString(publishedAt) : null

  if (status === "scheduled" && !normalizedPublishedAt) {
    throw new Error("Scheduled post requires valid publishedAt")
  }

  try {
    await createPostWithMediaWorkflow({
      creatorId,
      content: content || null,
      visibility,
      price: visibility === "paid" ? price : 0,
      status,
      publishedAt: normalizedPublishedAt,
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