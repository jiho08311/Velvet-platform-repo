import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"
import { checkSubscription } from "@/modules/subscription/server/check-subscription"
import { getStoryAccessState } from "../lib/get-story-access-state"
import { getStoryPublicState } from "../lib/get-story-public-state"
import { toStorySurfaceItem } from "../lib/to-story-surface-item"
import type { Story, StoryEditorState } from "../types"

type StoryProfileRow =
  | {
      avatar_url: string | null
      is_deactivated: boolean | null
      is_delete_pending: boolean | null
      deleted_at: string | null
      is_banned: boolean | null
    }
  | {
      avatar_url: string | null
      is_deactivated: boolean | null
      is_delete_pending: boolean | null
      deleted_at: string | null
      is_banned: boolean | null
    }[]
  | null

type StoryCreatorRow =
  | {
      id: string
      user_id: string
      username: string
      display_name: string | null
      status: string | null
      profiles: StoryProfileRow
    }
  | {
      id: string
      user_id: string
      username: string
      display_name: string | null
      status: string | null
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

export async function getStories(viewerUserId?: string | null): Promise<Story[]> {
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
        status,
        profiles (
          avatar_url,
          is_deactivated,
          is_delete_pending,
          deleted_at,
          is_banned
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

  const visibleStories = (data ?? []).filter((story) => {
    const creator = Array.isArray(story.creators)
      ? story.creators[0] ?? null
      : story.creators

    const profile = Array.isArray(creator?.profiles)
      ? creator?.profiles[0] ?? null
      : creator?.profiles

    const publicState = getStoryPublicState({
      now,
      story: {
        isDeleted: story.is_deleted,
        expiresAt: story.expires_at,
      },
      creator: creator
        ? {
            status: creator.status,
          }
        : null,
      profile: profile
        ? {
            isDeactivated: profile.is_deactivated,
            isDeletePending: profile.is_delete_pending,
            deletedAt: profile.deleted_at,
            isBanned: profile.is_banned,
          }
        : null,
    })

    return publicState === "visible"
  })

  return Promise.all(
    visibleStories.map(async (story) => {
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

      const hasSubscriptionAccess =
        story.visibility === "subscribers" && !isOwner
          ? resolvedViewerUserId && creator?.id
            ? await checkSubscription({
                userId: resolvedViewerUserId,
                creatorId: creator.id,
              })
            : false
          : false

      const accessState = getStoryAccessState({
        visibility: story.visibility,
        isOwner,
        hasSubscriptionAccess,
      })

      const mediaUrl =
        accessState === "visible_unlocked"
          ? await createMediaSignedUrl({
              storagePath: story.storage_path,
              viewerUserId: resolvedViewerUserId,
              creatorUserId: creator?.user_id ?? null,
              visibility: story.visibility,
              isSubscribed: isOwner ? true : hasSubscriptionAccess,
              hasPurchased: false,
            })
          : ""

      return toStorySurfaceItem({
        id: story.id,
        creatorId: story.creator_id,
        mediaUrl,
        mediaType: resolveStoryMediaType(story.storage_path),
        text: story.text,
        visibility: story.visibility,
        editorState: story.editor_state,
        createdAt: story.created_at,
        expiresAt: story.expires_at,
        isDeleted: story.is_deleted,
        accessState,
        creator: creator
          ? {
              id: creator.id,
              username: creator.username,
              displayName: creator.display_name,
              avatarUrl: profile?.avatar_url ?? null,
            }
          : null,
      })
    })
  )
}