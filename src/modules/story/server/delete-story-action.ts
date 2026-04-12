// src/modules/story/server/delete-story-action.ts
"use server"

import { revalidatePath } from "next/cache"

import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

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

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("stories")
    .select("id, creator_id")
    .eq("id", resolvedStoryId)
    .eq("is_deleted", false)
    .maybeSingle<{ id: string; creator_id: string }>()

  if (existingError) {
    throw existingError
  }

  if (!existing) {
    throw new Error("Story not found")
  }

  if (existing.creator_id !== creator.id) {
    throw new Error("Forbidden")
  }

  const { error: deleteError } = await supabaseAdmin
    .from("stories")
    .update({
      is_deleted: true,
    })
    .eq("id", resolvedStoryId)

  if (deleteError) {
    throw deleteError
  }

  revalidatePath("/feed")
}