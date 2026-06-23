// src/modules/media/repositories/story-media-binding-repository.ts

import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type StoryMediaBindingRow = {
  binding_id: string
  story_id: string
  media_id: string
  binding_role: string
  created_at: string
}

export async function createStoryMediaBinding(input: {
  storyId: string
  mediaId: string
  bindingRole?: string
}): Promise<StoryMediaBindingRow> {
  const { data, error } = await supabaseAdmin
    .from("story_media_bindings")
 .upsert(
  {
    story_id: input.storyId,
    media_id: input.mediaId,
    binding_role: input.bindingRole ?? "primary",
  },
  { onConflict: "story_id,media_id,binding_role" }
)
    .select("*")
    .single<StoryMediaBindingRow>()

  if (error || !data) {
    throw error ?? new Error("Failed to create story media binding")
  }

  return data
}

export async function findStoryMediaBindingsByStoryIds(
  storyIds: string[]
): Promise<StoryMediaBindingRow[]> {
  if (storyIds.length === 0) {
    return []
  }

const { data, error } = await supabaseAdmin
  .from("story_media_bindings")
  .select("*")
  .in("story_id", storyIds)
  .order("created_at", { ascending: true })
  .returns<StoryMediaBindingRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function deleteStoryMediaBinding(input: {
  storyId: string
  mediaId: string
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("story_media_bindings")
    .delete()
    .eq("story_id", input.storyId)
    .eq("media_id", input.mediaId)

  if (error) {
    throw error
  }
}