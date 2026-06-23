import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { StoryEditorState } from "@/modules/story/types"

export type StoryPersistenceRow = {
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

export type StoryOwnershipRow = {
  id: string
  creator_id: string
}

export async function insertStoryRow(
  values: Record<string, unknown>
): Promise<StoryPersistenceRow> {
  const { data, error } = await supabaseAdmin
    .from("stories")
    .insert(values)
    .select(
      "id, creator_id, storage_path, text, visibility, editor_state, created_at, expires_at, is_deleted",
    )
    .single<StoryPersistenceRow>()

  if (error) throw error

  return data
}

export async function findActiveStoryOwnership(
  storyId: string
): Promise<StoryOwnershipRow | null> {
  const { data, error } = await supabaseAdmin
    .from("stories")
    .select("id, creator_id")
    .eq("id", storyId)
    .eq("is_deleted", false)
    .maybeSingle<StoryOwnershipRow>()

  if (error) {
    throw error
  }

  return data
}

export async function softDeleteStoryRow(storyId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("stories")
    .update({
      is_deleted: true,
    })
    .eq("id", storyId)

  if (error) {
    throw error
  }
}

export async function updateStoryRow(input: {
  storyId: string
  updatePayload: {
    text?: string | null
    storage_path?: string
    editor_state?: StoryEditorState | null
  }
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("stories")
    .update(input.updatePayload)
    .eq("id", input.storyId)

  if (error) {
    throw error
  }
}

export async function listActiveStoryRows<TRow>(input: {
  now: string
  select: string
}): Promise<TRow[]> {
  const { data, error } = await supabaseAdmin
    .from("stories")
    .select(input.select)
    .eq("is_deleted", false)
    .gt("expires_at", input.now)
    .order("created_at", { ascending: true })
    .returns<TRow[]>()

  if (error) {
    throw error
  }

  return data ?? []
}

export async function findStoryReadTargetRow<TRow>(
  storyId: string
): Promise<TRow | null> {
  const { data, error } = await supabaseAdmin
    .from("stories")
    .select(
      `
        id,
        creator_id,
        visibility,
        expires_at,
        is_deleted,
        creators (
          id,
          user_id,
          status,
          creator_visibility_state,
          profiles (
            profile_lifecycle_state,
            identity_visibility_state,
            is_deactivated,
            is_delete_pending,
            deleted_at,
            is_banned
          )
        )
      `
    )
    .eq("id", storyId)
    .maybeSingle<TRow>()

  if (error) throw error

  return data
}

export async function listStoryReadStateRows(
  viewerUserId: string
): Promise<Array<{ creator_id: string; last_seen_story_id: string | null }>> {
  const { data, error } = await supabaseAdmin
    .from("story_read_states")
    .select("creator_id, last_seen_story_id")
    .eq("viewer_user_id", viewerUserId)

  if (error) throw error

  return data ?? []
}

export async function upsertStoryReadState(input: {
  viewerUserId: string
  creatorId: string
  lastSeenStoryId: string
  lastSeenAt: string
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("story_read_states")
    .upsert(
      {
        viewer_user_id: input.viewerUserId,
        creator_id: input.creatorId,
        last_seen_story_id: input.lastSeenStoryId,
        last_seen_at: input.lastSeenAt,
      },
      {
        onConflict: "viewer_user_id,creator_id",
      }
    )

  if (error) throw error
}
