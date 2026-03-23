"use server"

import { revalidatePath } from "next/cache"

import { createPost } from "./create-post"

type CreatePostActionInput = {
  creatorId: string
  text: string
  visibility: "public" | "subscribers" | "paid"
}

export async function createPostAction({
  creatorId,
  text,
  visibility,
}: CreatePostActionInput): Promise<void> {
  const content = text.trim()

  if (!content) {
    throw new Error("Post text is required")
  }

  await createPost({
    creatorId,
    content,
    visibility,
    status: "published",
  })

  revalidatePath("/creator")
  revalidatePath(`/creator/${creatorId}`)
}