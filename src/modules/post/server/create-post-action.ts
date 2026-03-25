"use server"

import { revalidatePath } from "next/cache"

import { createPostWithMediaWorkflow } from "@/workflows/create-post-with-media-workflow"

type CreatePostActionInput = {
  creatorId: string
  text: string
  visibility: "public" | "subscribers" | "paid"
  priceCents?: number
  files?: File[]
}

export async function createPostAction({
  creatorId,
  text,
  visibility,
  priceCents = 0,
  files = [],
}: CreatePostActionInput): Promise<void> {
  const content = text.trim()

  if (!content) {
    throw new Error("Post text is required")
  }

  if (visibility === "paid" && priceCents <= 0) {
    throw new Error("Paid post price must be greater than 0")
  }

  await createPostWithMediaWorkflow({
    creatorId,
    content,
    visibility,
    priceCents: visibility === "paid" ? priceCents : 0,
    status: "published",
    files,
  })

  revalidatePath("/feed")
  revalidatePath("/post/new")
  revalidatePath(`/creator/${creatorId}`)
}