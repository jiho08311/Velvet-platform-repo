import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { Media, MediaStatus, MediaType } from "../types"
import type { CreatePostAuthoringMediaRowInput } from "@/modules/post/types"
import { buildInitialMediaMutationModerationState } from "./media-mutation-moderation-policy"

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

type MediaRow = {
  id: string
  post_id: string | null
  message_id: string | null
  owner_user_id: string | null
  type: MediaType
  storage_path: string
  mime_type: string | null
  sort_order: number
  status: MediaStatus
  created_at: string
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

  const insertPayload: Record<string, unknown> = {
    post_id: resolvedPostId,
    message_id: resolvedMessageId,
    owner_user_id: resolvedOwnerUserId,
    type,
    storage_path: resolvedStoragePath,
    mime_type: mimeType ?? null,
    sort_order: sortOrder,
    status: initialModerationState?.status ?? status,
  }

  if (initialModerationState?.processingStatus) {
    insertPayload.processing_status = initialModerationState.processingStatus
  }

  if (initialModerationState?.moderationStatus) {
    insertPayload.moderation_status = initialModerationState.moderationStatus
  }

  if ("moderationSummary" in (initialModerationState ?? {})) {
    insertPayload.moderation_summary = initialModerationState?.moderationSummary ?? null
  }

  const { data, error } = await supabaseAdmin
    .from("media")
    .insert(insertPayload)
    .select(
      "id, post_id, message_id, owner_user_id, type, storage_path, mime_type, sort_order, status, created_at"
    )
    .single<MediaRow>()

  if (error) {
    throw error
  }

  return {
    id: data.id,
    postId: data.post_id,
    messageId: data.message_id,
    ownerUserId: data.owner_user_id,
    type: data.type,
    storagePath: data.storage_path,
    mimeType: data.mime_type,
    sortOrder: data.sort_order,
    status: data.status,
    createdAt: data.created_at,
  }
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
