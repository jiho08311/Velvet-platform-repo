import type { Media, MediaStatus, MediaType } from "../types"

export type MediaRow = {
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

export type CreateMediaInsertPayload = Record<string, unknown>

type CreateMediaModerationState = {
  status: MediaStatus
  processingStatus?: MediaStatus
  moderationStatus?: "pending" | "approved" | "rejected" | "needs_review"
  moderationSummary: null
}

export function buildCreateMediaInsertPayload({
  postId,
  messageId,
  ownerUserId,
  type,
  storagePath,
  mimeType,
  sortOrder,
  status,
  initialModerationState,
}: {
  postId: string | null
  messageId: string | null
  ownerUserId: string | null
  type: MediaType
  storagePath: string
  mimeType?: string
  sortOrder: number
  status: MediaStatus
  initialModerationState: CreateMediaModerationState | null
}): CreateMediaInsertPayload {
  const insertPayload: CreateMediaInsertPayload = {
    post_id: postId,
    message_id: messageId,
    owner_user_id: ownerUserId,
    type,
    storage_path: storagePath,
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
    insertPayload.moderation_summary =
      initialModerationState?.moderationSummary ?? null
  }

  return insertPayload
}

export function mapMediaRowToMedia(row: MediaRow): Media {
  return {
    id: row.id,
    postId: row.post_id,
    messageId: row.message_id,
    ownerUserId: row.owner_user_id,
    type: row.type,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    sortOrder: row.sort_order,
    status: row.status,
    createdAt: row.created_at,
  }
}
