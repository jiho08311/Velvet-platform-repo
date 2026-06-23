import { serveMediaUrl } from "@/modules/media/serving"
import { canAccessCreator } from "@/modules/commerce/public/entitlement-contract"
import { getStoryAccessState } from "@/modules/story/policies/get-story-access-state"
import { toStorySurfaceItem } from "@/modules/story/mappers/to-story-surface-item"
import type { Story } from "@/modules/story/types"
import type { ResolvedStoryRow } from "@/modules/story/runtime/get-stories-types"

type StoryMediaReadRow = {
  storyId: string
  media: {
    id: string
    storagePath: string
    mediaType: string
  }
}

async function resolveStorySubscriptionAccess(input: {
  story: ResolvedStoryRow
  isOwner: boolean
  viewerUserId: string | null
}): Promise<boolean> {
  if (input.story.row.visibility !== "subscribers" || input.isOwner) {
    return false
  }

  if (!input.viewerUserId || !input.story.creatorRow?.id) {
    return false
  }

  const { decision } = await canAccessCreator({
    viewerUserId: input.viewerUserId,
    creatorId: input.story.creatorRow.id,
  })

  return decision.allowed
}

export async function buildStorySurfaceItem(input: {
  story: ResolvedStoryRow
  viewerUserId: string | null
  storyMedia: StoryMediaReadRow | undefined
}): Promise<Story> {
  const creator = input.story.creatorRow
  const isOwner =
    !!input.viewerUserId &&
    !!creator?.user_id &&
    input.viewerUserId === creator.user_id
  const hasSubscriptionAccess = await resolveStorySubscriptionAccess({
    story: input.story,
    isOwner,
    viewerUserId: input.viewerUserId,
  })
  const accessState = getStoryAccessState({
    visibility: input.story.row.visibility,
    isOwner,
    hasSubscriptionAccess,
  })
  const storagePath =
    input.storyMedia?.media.storagePath ?? input.story.row.storage_path
  const mediaUrl =
    accessState === "visible_unlocked"
      ? await serveMediaUrl({
          storagePath,
          viewerUserId: input.viewerUserId,
          creatorUserId: creator?.user_id ?? null,
          visibility: input.story.row.visibility,
          isSubscribed: isOwner ? true : hasSubscriptionAccess,
          hasPurchased: false,
          mediaId: input.storyMedia?.media.id,
          capabilityKind: "story_media_signed_url",
          capabilitySurface: "story_media_read_switch",
        })
      : ""

  return toStorySurfaceItem({
    id: input.story.row.id,
    creatorId: input.story.row.creator_id,
    mediaUrl,
    mediaType: input.storyMedia?.media.mediaType === "video" ? "video" : "image",
    text: input.story.row.text,
    visibility: input.story.row.visibility,
    editorState: input.story.row.editor_state,
    createdAt: input.story.row.created_at,
    expiresAt: input.story.row.expires_at,
    isDeleted: input.story.row.is_deleted,
    accessState,
    creator: input.story.creatorSurface,
  })
}
