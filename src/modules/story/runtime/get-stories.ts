import { getStorySurfaceEligibility } from "@/modules/story/policies/get-story-surface-eligibility"
import type { Story } from "@/modules/story/types"
import { listStoryMedia } from "@/modules/media/public/list-story-media"
import { listActiveStoryRows } from "@/modules/story/repositories/story-repository"
import { buildStorySurfaceItem } from "@/modules/story/runtime/get-stories-item"
import { resolveStoryRow } from "@/modules/story/runtime/get-stories-mappers"
import type { StoryRow } from "@/modules/story/runtime/get-stories-types"
import { logger } from "@/shared/observability/structured-logger"

async function compareStoryMediaRead(input: {
  storyIds: string[]
  legacyCount: number
}) {
  try {
    const newRows = await listStoryMedia({
      storyIds: input.storyIds,
      requireReadyAsset: true,
    })

    if (input.legacyCount !== newRows.length) {
      logger.warn({
        event: "story.media_read_compare_mismatch",
        context: {
          storyIds: input.storyIds,
          legacyCount: input.legacyCount,
          newCount: newRows.length,
        },
      })
    }
  } catch (error) {
    logger.warn({
      event: "story.media_read_compare_failed_open",
      context: {
        storyIds: input.storyIds,
      },
      error,
    })
  }
}

function normalizeViewerUserId(viewerUserId?: string | null): string | null {
  return typeof viewerUserId === "string" && viewerUserId.trim().length > 0
    ? viewerUserId.trim()
    : null
}

export async function getStories(viewerUserId?: string | null): Promise<Story[]> {
  const now = new Date().toISOString()
  const resolvedViewerUserId = normalizeViewerUserId(viewerUserId)
  const data = await listActiveStoryRows<StoryRow>({
    now,
    select: `
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
        creator_visibility_state,
        profiles (
          avatar_url,
          profile_lifecycle_state,
          identity_visibility_state,
          is_deactivated,
          is_delete_pending,
          deleted_at,
          is_banned
        )
      )
    `,
  })

  const visibleStories = data
    .map((story) => resolveStoryRow(story, now))
    .filter(
      (story) => getStorySurfaceEligibility(story.eligibilityInput) === "included"
    )
  const storyIds = visibleStories.map((story) => story.row.id)

  await compareStoryMediaRead({
    storyIds,
    legacyCount: visibleStories.length,
  })

  const storyMediaRows = await listStoryMedia({
    storyIds,
    requireReadyAsset: true,
  })
  const storyMediaByStoryId = new Map(
    storyMediaRows.map((item) => [item.storyId, item])
  )

  return Promise.all(
    visibleStories.map((story) =>
      buildStorySurfaceItem({
        story,
        viewerUserId: resolvedViewerUserId,
        storyMedia: storyMediaByStoryId.get(story.row.id),
      })
    )
  )
}
