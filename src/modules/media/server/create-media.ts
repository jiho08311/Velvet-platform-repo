import type { Media, MediaStatus, MediaType } from "../types"
import type { CreatePostAuthoringMediaRowInput } from "@/modules/post/types"
import { buildInitialMediaMutationModerationState } from "./media-mutation-moderation-policy"
import {
  buildCreateMediaInsertPayload,
  mapMediaRowToMedia,
} from "../mappers/media-mapper"
import { insertMediaRow } from "../repositories/media-repository"

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

export async function createMedia({
  postId = null,
  messageId = null,
  ownerUserId = null,
  type,
  storagePath,
  mimeType,
  sortOrder = 0,
  status = "processing",
  useInitialModerationState = false,
}: CreateMediaInput): Promise<Media> {
  const resolvedPostId = postId?.trim() || null
  const resolvedMessageId = messageId?.trim() || null
  const resolvedOwnerUserId = ownerUserId?.trim() || null
  const resolvedStoragePath = storagePath.trim()

  if (!resolvedStoragePath) {
    throw new Error("storagePath is required")
  }

  const initialModerationState = useInitialModerationState
    ? buildInitialMediaMutationModerationState({ type })
    : null

  const insertPayload = buildCreateMediaInsertPayload({
    postId: resolvedPostId,
    messageId: resolvedMessageId,
    ownerUserId: resolvedOwnerUserId,
    type,
    storagePath: resolvedStoragePath,
    mimeType,
    sortOrder,
    status,
    initialModerationState,
  })
  const row = await insertMediaRow(insertPayload)

  return mapMediaRowToMedia(row)
}

export async function createPostAuthoringMedia({
  postId,
  ownerUserId,
  media,
  status = "processing",
  useInitialModerationState = true,
}: CreatePostAuthoringMediaInput): Promise<Media> {
  return createMedia({
    postId,
    ownerUserId,
    type: resolvePersistedMediaType(media.uploaded.type),
    storagePath: media.uploaded.path,
    mimeType: media.uploaded.mimeType || undefined,
    sortOrder: media.sortOrder,
    status,
    useInitialModerationState,
  })
}
