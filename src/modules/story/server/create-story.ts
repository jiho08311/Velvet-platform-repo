import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { StoryEditorState } from "../types"

type CreateStoryInput = {
  creatorId: string
  storagePath: string
  text?: string | null
  visibility?: "public" | "subscribers"
  editorState?: StoryEditorState | null
}

type CreatorRow = {
  id: string
}

type StoryRow = {
  id: string
  creator_id: string
  storage_path: string
  text: string | null
  visibility: "public" | "subscribers"
  editor_state: StoryEditorState | null
  created_at: string
  expires_at: string
  is_deleted: boolean
}

export async function createStory({
  creatorId,
  storagePath,
  text,
  visibility = "subscribers",
  editorState = null,
}: CreateStoryInput): Promise<{
  id: string
  creatorId: string
  mediaUrl: string
  text: string | null
  visibility: "public" | "subscribers"
  editorState: StoryEditorState | null
  createdAt: string
  expiresAt: string
  isDeleted: boolean
}> {
  const resolvedCreatorId = creatorId.trim()
  const resolvedStoragePath = storagePath.trim()

  if (!resolvedCreatorId) {
    throw new Error("Creator id is required")
  }

  if (!resolvedStoragePath) {
    throw new Error("Storage path is required")
  }

  const { data: creator, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select("id")
    .eq("id", resolvedCreatorId)
    .maybeSingle<CreatorRow>()

  if (creatorError) {
    throw creatorError
  }

  if (!creator) {
    throw new Error("Only creators can create stories")
  }

  const createdAt = new Date()
  const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000)

  const { data, error } = await supabaseAdmin
    .from("stories")
    .insert({
      creator_id: resolvedCreatorId,
      storage_path: resolvedStoragePath,
      text: text?.trim() || null,
      visibility,
      editor_state: editorState,
      created_at: createdAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      is_deleted: false,
    })
    .select(
      "id, creator_id, storage_path, text, visibility, editor_state, created_at, expires_at, is_deleted"
    )
    .single<StoryRow>()

  if (error) {
    throw error
  }

  return {
    id: data.id,
    creatorId: data.creator_id,
    mediaUrl: data.storage_path,
    text: data.text,
    visibility: data.visibility,
    editorState: data.editor_state,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
    isDeleted: data.is_deleted,
  }
}