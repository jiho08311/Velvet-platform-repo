import {
  buildStoryInsertValues,
  normalizeStoryCreatePayload,
} from "@/modules/story/runtime/story-create-payload"
import type {
  ProcessedStoryVideoCreateInput,
  StoryCreatePayload,
  StoryEditorState,
} from "../types"
import {
  createMediaAssetRuntime,
  type MediaAssetContract,
} from "@/modules/media/public/create-media-asset-runtime"
import { createStoryMediaBinding } from "@/modules/media/public/story-media-binding"
import { readCreatorIdentityByCreatorId } from "@/modules/identity/public/creator-identity-read-model"
import {
  insertStoryRow,
  type StoryPersistenceRow,
} from "@/modules/story/repositories/story-repository"
import { logger } from "@/shared/observability/structured-logger"

const MEDIA_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media"

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

type StoryRow = StoryPersistenceRow

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

async function shadowWriteStoryMedia(input: {
  storyId: string
  ownerUserId: string | null
  storagePath: string
  sourceSurface: string
}): Promise<MediaAssetContract | null> {
  if (!input.ownerUserId) return null

  try {
    const asset = await createMediaAssetRuntime({
      ownerUserId: input.ownerUserId,
      mediaType: resolveStoryMediaType(input.storagePath),
      mimeType: null,
      storageBucket: MEDIA_BUCKET,
      storagePath: input.storagePath,
      processingStatus: "ready",
      sourceSurface: input.sourceSurface,
    })

    await createStoryMediaBinding({
      storyId: input.storyId,
      mediaId: asset.id,
      bindingRole: "primary",
    })

    return asset
  } catch (error) {
    logger.warn({
      event: "story.media_shadow_write_failed_open",
      context: {
        storyId: input.storyId,
        storagePath: input.storagePath,
      },
      error,
    })

    return null
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

  return insertStoryRow(
    buildStoryInsertValues({
      creatorId,
      storagePath,
      story: payload,
      createdAt,
      expiresAt,
    }),
  )
}

export async function createStory({
  creatorId,
  storagePath,
  story,
}: CreateStoryInput) {
  const resolvedCreatorId = creatorId.trim()
  const resolvedStoragePath = storagePath.trim()

  if (!resolvedCreatorId) throw new Error("Creator id is required")
  if (!resolvedStoragePath) throw new Error("Storage path is required")

  const creator = await readCreatorIdentityByCreatorId(resolvedCreatorId)

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

  await shadowWriteStoryMedia({
    storyId: data.id,
    ownerUserId: creator.userId,
    storagePath: data.storage_path,
    sourceSurface: "legacy_create_story_shadow_write",
  })

  return mapStoryRowToStory(data)
}

export async function createStoryFromVideoProcessing({
  creatorId,
  processedVideoStoragePath,
  story,
  expiresAt,
}: ProcessedStoryVideoCreateInput): Promise<string> {
  const creator = await readCreatorIdentityByCreatorId(creatorId)

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

  await shadowWriteStoryMedia({
    storyId: data.id,
    ownerUserId: creator?.userId ?? null,
    storagePath: data.storage_path,
    sourceSurface: "legacy_story_video_processing_shadow_write",
  })

  return data.id
}
