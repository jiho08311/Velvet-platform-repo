// src/modules/story/server/update-story-action.ts
"use server"

import { revalidatePath } from "next/cache"

import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { StoryEditorState } from "../types"

type UpdateStoryActionInput = {
  storyId: string
  text?: string
  storagePath?: string | null
  editorState?: StoryEditorState | null
}

export async function updateStoryAction({
  storyId,
  text,
  storagePath,
  editorState,
}: UpdateStoryActionInput): Promise<void> {
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

  const nextText = typeof text === "string" ? text.trim() || null : undefined
  const nextStoragePath =
    typeof storagePath === "string" ? storagePath.trim() || null : undefined
  const nextEditorState =
    typeof editorState === "undefined" ? undefined : editorState

  const updatePayload: {
    text?: string | null
    storage_path?: string
    editor_state?: StoryEditorState | null
  } = {}

  if (typeof nextText !== "undefined") {
    updatePayload.text = nextText
  }

  if (typeof nextStoragePath !== "undefined" && nextStoragePath) {
    updatePayload.storage_path = nextStoragePath
  }

  if (typeof nextEditorState !== "undefined") {
    updatePayload.editor_state = nextEditorState
  }

  if (Object.keys(updatePayload).length === 0) {
    return
  }

  const { error: updateError } = await supabaseAdmin
    .from("stories")
    .update(updatePayload)
    .eq("id", resolvedStoryId)

  if (updateError) {
    throw updateError
  }

  revalidatePath("/feed")
}