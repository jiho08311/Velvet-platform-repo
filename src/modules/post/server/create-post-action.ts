"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createPostWithMediaWorkflow } from "@/workflows/create-post-with-media-workflow"

type CreatePostActionInput = {
  creatorId: string
  text: string
  visibility: "public" | "subscribers" | "paid"
  price?: number
  files?: File[]
}

export async function createPostAction({
  creatorId,
  text,
  visibility,
  price = 0,
  files = [],
}: CreatePostActionInput): Promise<void> {
  const content = text.trim()
  const hasMedia = files.length > 0

  if (!content && !hasMedia) {
    throw new Error("Post must have text or media")
  }

  if (visibility === "paid" && price <= 0) {
    throw new Error("Paid post price must be greater than 0")
  }

  await createPostWithMediaWorkflow({
    creatorId,
    content: content || null,
    visibility,
    price: visibility === "paid" ? price : 0,
    status: "published",
    files,
  })

  revalidatePath("/feed")
  revalidatePath("/post/new")
  revalidatePath(`/creator/${creatorId}`)
  revalidatePath("/profile")

  redirect("/profile")
}