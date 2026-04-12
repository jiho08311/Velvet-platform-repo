"use server"

import { revalidatePath } from "next/cache"

import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { createStory } from "@/modules/story/server/create-story"
import type { StoryEditorState } from "../types"

type CreateStoryActionInput = {
  storagePath: string
  text?: string
  visibility: "public" | "subscribers"
  editorState?: StoryEditorState
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

  await createStory({
    creatorId: creator.id,
    storagePath,
    text: text?.trim() || null,
    visibility,
    editorState: editorState ?? null,
  })

  revalidatePath("/feed")
}