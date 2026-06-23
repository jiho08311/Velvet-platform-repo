"use server"
import type { CreateOrEditPostFormBlock } from "../types"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createPostWithMediaWorkflow } from "@/workflows/create-post-with-media-workflow"
import { normalizeCreatePostDraftIntent } from "@/modules/post/mappers/normalize-create-post-draft"
import { logger } from "@/shared/observability/structured-logger"


type CreatePostActionInput = {
  creatorId: string
  status?: "draft" | "scheduled" | "published"
  publishedAt?: string | null
  visibility: "public" | "subscribers" | "paid"
  price?: number
  blocks?: CreateOrEditPostFormBlock[]
}

export async function createPostAction({
  creatorId,
  status = "published",
  publishedAt = null,
  visibility,
  price = 0,
  blocks = [],
}: CreatePostActionInput): Promise<void> {
  const draftIntent = normalizeCreatePostDraftIntent({
    creatorId,
    status,
    publishedAt,
    visibility,
    price,
    blocks,
  })

  try {
    await createPostWithMediaWorkflow(draftIntent)
  } catch (error) {
    logger.error({
      event: "post.create_action_failed",
      context: { creatorId, status, visibility },
      error,
    })

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
