"use server"

import { revalidatePath } from "next/cache"

import { createPost } from "./create-post"

type CreatePostActionInput = {
  creatorId: string
  text: string
  visibility: "public" | "subscribers" | "paid"
  priceCents?: number
}

export async function createPostAction({
  creatorId,
  text,
  visibility,
  priceCents = 0,
}: CreatePostActionInput): Promise<void> {
  const content = text.trim()

  if (!content) {
    throw new Error("Post text is required")
  }

  // ✅ paid validation
  if (visibility === "paid" && priceCents <= 0) {
    throw new Error("Paid post price must be greater than 0")
  }

  await createPost({
    creatorId,
    content,
    visibility,
    priceCents: visibility === "paid" ? priceCents : 0,
    status: "published",
  })

  revalidatePath("/creator")
  revalidatePath(`/creator/${creatorId}`)
}