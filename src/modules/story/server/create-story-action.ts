"use server"

import { revalidatePath } from "next/cache"

import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { normalizeStoryCreatePayload } from "@/modules/story/lib/story-create-payload"
import { createStory } from "@/modules/story/server/create-story"
import type { StoryCreatePayload } from "../types"

type CreateStoryActionInput = StoryCreatePayload & {
  storagePath: string
}

export async function createStoryAction({
  storagePath,
  text,
  visibility,
  editorState,
}: CreateStoryActionInput): Promise<void> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const creator = await getCreatorByUserId(user.id)

  if (!creator) {
    throw new Error("Creator not found")
  }

  const payload = normalizeStoryCreatePayload({
    text,
    visibility,
    editorState,
  })

  await createStory({
    creatorId: creator.id,
    storagePath,
    story: payload,
  })

  revalidatePath("/feed")
}
