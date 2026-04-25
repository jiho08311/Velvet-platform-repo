import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import {
  buildStoryInsertValues,
  normalizeStoryCreatePayload,
} from "../lib/story-create-payload"
import type {
  ProcessedStoryVideoCreateInput,
  StoryCreatePayload,
  StoryEditorState,
} from "../types"

type CreateStoryInput = {
  creatorId: string
  storagePath: string
  story: StoryCreatePayload
}

type PersistStoryRowInput = {
  creatorId: string
  storagePath: string
  story: StoryCreatePayload
  createdAt: string
  expiresAt: string
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

function mapStoryRowToStory(data: StoryRow) {
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

export async function persistStoryRow({
  creatorId,
  storagePath,
  story,
  createdAt,
  expiresAt,
}: PersistStoryRowInput): Promise<StoryRow> {
  const payload = normalizeStoryCreatePayload(story)

  const { data, error } = await supabaseAdmin
    .from("stories")
    .insert(
      buildStoryInsertValues({
        creatorId,
        storagePath,
        story: payload,
        createdAt,
        expiresAt,
      })
    )
    .select(
      "id, creator_id, storage_path, text, visibility, editor_state, created_at, expires_at, is_deleted"
    )
    .single<StoryRow>()

  if (error) {
    throw error
  }

  return data
}

export async function createStory({
  creatorId,
  storagePath,
  story,
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
  const data = await persistStoryRow({
    creatorId: resolvedCreatorId,
    storagePath: resolvedStoragePath,
    story,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  })

  return mapStoryRowToStory(data)
}

export async function createStoryFromVideoProcessing({
  creatorId,
  processedVideoStoragePath,
  story,
  expiresAt,
}: ProcessedStoryVideoCreateInput): Promise<string> {
  const data = await persistStoryRow({
    creatorId,
    storagePath: processedVideoStoragePath,
    story: {
      text: null,
      visibility: story.visibility,
      editorState: story.editorState,
    },
    createdAt: new Date().toISOString(),
    expiresAt,
  })

  return data.id
}
