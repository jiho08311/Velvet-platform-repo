// src/modules/story/runtime/delete-story-action.ts
"use server"

import { revalidatePath } from "next/cache"

import { getCurrentUser } from "@/modules/auth/public/get-current-user"
import { getCreatorByUserId } from "@/modules/creator/public/get-creator-by-user-id"
import {
  findActiveStoryOwnership,
  softDeleteStoryRow,
} from "@/modules/story/repositories/story-repository"

type DeleteStoryActionInput = {
  storyId: string
}

export async function deleteStoryAction({
  storyId,
}: DeleteStoryActionInput): Promise<void> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const creator = await getCreatorByUserId(user.id)

  if (!creator) {
    throw new Error("Creator not found")
  }

  const resolvedStoryId = storyId.trim()

  if (!resolvedStoryId) {
    throw new Error("Story id is required")
  }

  const existing = await findActiveStoryOwnership(resolvedStoryId)

  if (!existing) {
    throw new Error("Story not found")
  }

  if (existing.creator_id !== creator.id) {
    throw new Error("Forbidden")
  }

  await softDeleteStoryRow(resolvedStoryId)

  revalidatePath("/feed")
}
