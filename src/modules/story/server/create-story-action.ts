"use server"

import { revalidatePath } from "next/cache"

import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { createStory } from "@/modules/story/server/create-story"

type CreateStoryActionInput = {
  storagePath: string
  text?: string
  visibility: "public" | "subscribers"
}

export async function createStoryAction({
  storagePath,
  text,
  visibility,
}: CreateStoryActionInput): Promise<void> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const creator = await getCreatorByUserId(user.id)

  if (!creator) {
    throw new Error("Creator not found")
  }

await createStory({
  creatorId: creator.id,
  storagePath,
  text: text?.trim() || null,
  visibility,
})

  revalidatePath("/feed")
}