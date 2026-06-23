import type { Media, MediaStatus, MediaType } from "../types"
import type { CreatePostAuthoringMediaRowInput } from "@/modules/post/types"
import {
  createMediaAssetRuntime,
  type MediaAssetContract,
} from "@/modules/media/runtime/create-media-asset-runtime"
import { createPostMediaBinding } from "@/modules/media/public/post-media-binding"
import { createMessageMediaBinding } from "@/modules/media/repositories/message-media-binding-repository"

const MEDIA_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media"

type CreateMediaInput = {
  postId?: string | null
  messageId?: string | null
  ownerUserId?: string | null
  type: MediaType
  storagePath: string
  mimeType?: string
  sortOrder?: number
  status?: MediaStatus
  useInitialModerationState?: boolean
}

type CreatePostAuthoringMediaInput = {
  postId: string
  ownerUserId: string
  media: CreatePostAuthoringMediaRowInput
  status?: MediaStatus
  useInitialModerationState?: boolean
}

function resolvePersistedMediaType(
  type: CreatePostAuthoringMediaRowInput["uploaded"]["type"]
): MediaType {
  if (type === "image") return "image"
  if (type === "video") return "video"
  if (type === "audio") return "audio"
  return "file"
}

function resolveAssetProcessingStatus(
  status: MediaStatus
): "pending" | "processing" | "ready" | "failed" {
  if (status === "ready") return "ready"
  if (status === "failed") return "failed"
  return "processing"
}

function resolveMediaStatusFromAsset(
  asset: MediaAssetContract
): MediaStatus {
  if (asset.processingStatus === "ready") return "ready"
  if (asset.processingStatus === "failed") return "failed"
  return "processing"
}

async function writeMediaBindings(input: {
  mediaAssetId: string
  postId: string | null
  messageId: string | null
  sortOrder: number
}) {
  if (input.postId) {
    await createPostMediaBinding({
      postId: input.postId,
      mediaId: input.mediaAssetId,
      bindingRole: "primary",
      sortOrder: input.sortOrder,
    })
  }

  if (input.messageId) {
    await createMessageMediaBinding({
      messageId: input.messageId,
      mediaId: input.mediaAssetId,
      bindingRole: "attachment",
    })
  }
}
function mapMediaAssetToLegacyMedia(input: {
  asset: MediaAssetContract
  postId: string | null
  messageId: string | null
  sortOrder: number
}): Media {
  return {
    id: input.asset.legacyMediaId ?? input.asset.id,
    postId: input.postId,
    messageId: input.messageId,
    ownerUserId: input.asset.ownerUserId,
    type: input.asset.mediaType,
    storagePath: input.asset.storagePath,
    mimeType: input.asset.mimeType,
    sortOrder: input.sortOrder,
    status: resolveMediaStatusFromAsset(input.asset),
    createdAt: input.asset.createdAt,
  }
}

export async function createMedia({
  postId = null,
  messageId = null,
  ownerUserId = null,
  type,
  storagePath,
  mimeType,
  sortOrder = 0,
  status = "processing",
}: CreateMediaInput): Promise<Media> {
  const resolvedPostId = postId?.trim() || null
  const resolvedMessageId = messageId?.trim() || null
  const resolvedOwnerUserId = ownerUserId?.trim() || null
  const resolvedStoragePath = storagePath.trim()

  if (!resolvedOwnerUserId) {
    throw new Error("ownerUserId is required")
  }

  if (!resolvedStoragePath) {
    throw new Error("storagePath is required")
  }

  const asset = await createMediaAssetRuntime({
    ownerUserId: resolvedOwnerUserId,
    mediaType: type,
    mimeType: mimeType ?? null,
    storageBucket: MEDIA_BUCKET,
    storagePath: resolvedStoragePath,
    processingStatus: resolveAssetProcessingStatus(status),
    sourceSurface: "create_media_new_authority",
  })

  await writeMediaBindings({
    mediaAssetId: asset.id,
    postId: resolvedPostId,
    messageId: resolvedMessageId,
    sortOrder,
  })

  return mapMediaAssetToLegacyMedia({
    asset,
    postId: resolvedPostId,
    messageId: resolvedMessageId,
    sortOrder,
  })
}

export async function createPostAuthoringMedia({
  postId,
  ownerUserId,
  media,
  status = "processing",
}: CreatePostAuthoringMediaInput): Promise<Media> {
  return createMedia({
    postId,
    ownerUserId,
    type: resolvePersistedMediaType(media.uploaded.type),
    storagePath: media.uploaded.path,
    mimeType: media.uploaded.mimeType || undefined,
    sortOrder: media.sortOrder,
    status,
  })
}