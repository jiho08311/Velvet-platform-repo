"use server"
import type { CreatePostDraftBlock } from "../types"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createPostWithMediaWorkflow } from "@/workflows/create-post-with-media-workflow"
import { localDateTimeToUtcIso } from "@/shared/lib/date-time"


type CreatePostActionInput = {
  creatorId: string
  status?: "draft" | "scheduled" | "published"
  publishedAt?: string | null
  visibility: "public" | "subscribers" | "paid"
  price?: number
  blocks?: CreatePostDraftBlock[]
}

export async function createPostAction({
  creatorId,
  status = "published",
  publishedAt = null,
  visibility,
  price = 0,
  blocks = [],
}: CreatePostActionInput): Promise<void> {
const normalizedContent = null
  const hasBlocks = blocks.length > 0

  if (!normalizedContent && !hasBlocks) {
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
    await createPostWithMediaWorkflow({
      creatorId,
      content: normalizedContent,
      visibility,
      price: visibility === "paid" ? price : 0,
      status,
      publishedAt: normalizedPublishedAt,
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