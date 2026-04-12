import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"
import { checkSubscription } from "@/modules/subscription/server/check-subscription"
import type { StoryEditorState } from "../types"

type StoryProfileRow =
  | {
      avatar_url: string | null
    }
  | {
      avatar_url: string | null
    }[]
  | null

type StoryCreatorRow =
  | {
      id: string
      user_id: string
      username: string
      display_name: string | null
      profiles: StoryProfileRow
    }
  | {
      id: string
      user_id: string
      username: string
      display_name: string | null
      profiles: StoryProfileRow
    }[]
  | null

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
  creators: StoryCreatorRow
}

function resolveStoryMediaType(storagePath: string): "image" | "video" {
  const lower = storagePath.toLowerCase()

  if (
    lower.endsWith(".mp4") ||
    lower.endsWith(".mov") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".m4v")
  ) {
    return "video"
  }

  return "image"
}

export async function getStories(viewerUserId?: string | null): Promise<
  Array<{
    id: string
    creatorId: string
    mediaUrl: string
    mediaType: "image" | "video"
    text: string | null
    visibility: "public" | "subscribers"
    editorState: StoryEditorState | null
    createdAt: string
    expiresAt: string
    isDeleted: boolean
    isLocked: boolean
    lockReason: "none" | "subscription"
    creator: {
      id: string
      username: string
      displayName: string | null
      avatarUrl: string | null
    } | null
  }>
> {
  const now = new Date().toISOString()
  const resolvedViewerUserId =
    typeof viewerUserId === "string" && viewerUserId.trim().length > 0
      ? viewerUserId.trim()
      : null

  const { data, error } = await supabaseAdmin
    .from("stories")
    .select(`
      id,
      creator_id,
      storage_path,
      text,
      visibility,
      editor_state,
      created_at,
      expires_at,
      is_deleted,
      creators (
        id,
        user_id,
        username,
        display_name,
        profiles (
          avatar_url
        )
      )
    `)
    .eq("is_deleted", false)
    .gt("expires_at", now)
    .order("created_at", { ascending: true })
    .returns<StoryRow[]>()

  if (error) {
    throw error
  }

  return Promise.all(
    (data ?? []).map(async (story) => {
      const creator = Array.isArray(story.creators)
        ? story.creators[0] ?? null
        : story.creators

      const profile = Array.isArray(creator?.profiles)
        ? creator?.profiles[0] ?? null
        : creator?.profiles

      const isOwner =
        !!resolvedViewerUserId &&
        !!creator?.user_id &&
        resolvedViewerUserId === creator.user_id

      let isLocked = false
      let lockReason: "none" | "subscription" = "none"
      let isSubscribed = false

      if (story.visibility === "subscribers" && !isOwner) {
        isSubscribed =
          resolvedViewerUserId && creator?.id
            ? await checkSubscription({
                userId: resolvedViewerUserId,
                creatorId: creator.id,
              })
            : false

        if (!isSubscribed) {
          isLocked = true
          lockReason = "subscription"
        }
      }

      const mediaUrl = isLocked
        ? ""
        : await createMediaSignedUrl({
            storagePath: story.storage_path,
            viewerUserId: resolvedViewerUserId,
            creatorUserId: creator?.user_id ?? null,
            visibility: story.visibility,
            isSubscribed: isOwner ? true : isSubscribed,
            hasPurchased: false,
          })

      return {
        id: story.id,
        creatorId: story.creator_id,
        mediaUrl,
        mediaType: resolveStoryMediaType(story.storage_path),
        text: isLocked ? null : story.text,
        visibility: story.visibility,
        editorState: isLocked ? null : story.editor_state,
        createdAt: story.created_at,
        expiresAt: story.expires_at,
        isDeleted: story.is_deleted,
        isLocked,
        lockReason,
        creator: creator
          ? {
              id: creator.id,
              username: creator.username,
              displayName: creator.display_name,
              avatarUrl: profile?.avatar_url ?? null,
            }
          : null,
      }
    })
  )
}