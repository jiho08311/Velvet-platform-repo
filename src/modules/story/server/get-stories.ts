import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createMediaSignedUrl } from "@/modules/media/server/create-media-signed-url"
import { checkSubscription } from "@/modules/subscription/server/check-subscription"
import { getStoryAccessState } from "../lib/get-story-access-state"
import { getStorySurfaceEligibility } from "../lib/get-story-surface-eligibility"
import { toStorySurfaceItem } from "../lib/to-story-surface-item"
import type {
  Story,
  StoryCreator,
  StoryEditorState,
  StorySurfaceEligibilityInput,
} from "../types"

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

type ResolvedStoryRow = {
  row: StoryRow
  creatorRow:
    | {
        id: string
        user_id: string
        username: string
        display_name: string | null
        status: string | null
      }
    | null
  profileRow:
    | {
        avatar_url: string | null
        is_deactivated: boolean | null
        is_delete_pending: boolean | null
        deleted_at: string | null
        is_banned: boolean | null
      }
    | null
  eligibilityInput: StorySurfaceEligibilityInput
  creatorSurface: StoryCreator | null
}

function pickJoinedRow<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value
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

function resolveStoryRow(
  row: StoryRow,
  now: string
): ResolvedStoryRow {
  const creator = pickJoinedRow(row.creators)
  const profile = pickJoinedRow(creator?.profiles ?? null)

  return {
    row,
    creatorRow: creator
      ? {
          id: creator.id,
          user_id: creator.user_id,
          username: creator.username,
          display_name: creator.display_name,
          status: creator.status,
        }
      : null,
    profileRow: profile,
    eligibilityInput: {
      now,
      story: {
        isDeleted: row.is_deleted,
        expiresAt: row.expires_at,
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
    },
    creatorSurface: creator
      ? {
          id: creator.id,
          username: creator.username,
          displayName: creator.display_name,
          avatarUrl: profile?.avatar_url ?? null,
        }
      : null,
  }
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

  const visibleStories = (data ?? [])
    .map((story) => resolveStoryRow(story, now))
    .filter(
      (story) => getStorySurfaceEligibility(story.eligibilityInput) === "included"
    )

  return Promise.all(
    visibleStories.map(async (story) => {
      const creator = story.creatorRow

      const isOwner =
        !!resolvedViewerUserId &&
        !!creator?.user_id &&
        resolvedViewerUserId === creator.user_id

      const hasSubscriptionAccess =
        story.row.visibility === "subscribers" && !isOwner
          ? resolvedViewerUserId && creator?.id
            ? await checkSubscription({
                userId: resolvedViewerUserId,
                creatorId: creator.id,
              })
            : false
          : false

      const accessState = getStoryAccessState({
        visibility: story.row.visibility,
        isOwner,
        hasSubscriptionAccess,
      })

      const mediaUrl =
        accessState === "visible_unlocked"
          ? await createMediaSignedUrl({
              storagePath: story.row.storage_path,
              viewerUserId: resolvedViewerUserId,
              creatorUserId: creator?.user_id ?? null,
              visibility: story.row.visibility,
              isSubscribed: isOwner ? true : hasSubscriptionAccess,
              hasPurchased: false,
            })
          : ""

      return toStorySurfaceItem({
        id: story.row.id,
        creatorId: story.row.creator_id,
        mediaUrl,
        mediaType: resolveStoryMediaType(story.row.storage_path),
        text: story.row.text,
        visibility: story.row.visibility,
        editorState: story.row.editor_state,
        createdAt: story.row.created_at,
        expiresAt: story.row.expires_at,
        isDeleted: story.row.is_deleted,
        accessState,
        creator: story.creatorSurface,
      })
    })
  )
}
