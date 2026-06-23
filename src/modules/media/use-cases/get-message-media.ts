import { createMessageMediaBinding } from "@/modules/media/repositories/message-media-binding-repository"
import { listMessageMedia } from "@/modules/media/public/list-message-media"
import {
  findMediaAssetById,
  findMediaAssetsByIds,
  findMediaAssetsByLegacyMediaIds,
} from "@/modules/media/repositories/media-asset-repository"
import { getMediaModerationDecision } from "@/modules/media/public/media-moderation"
import type { MessageMediaItemContract } from "@/modules/media/public/list-message-media"

export type MessageMediaRow = {
  id: string
  message_id: string | null
  storage_path: string
  mime_type: string | null
}

export type ModerationMediaRow = {
  id: string
  storage_path: string
  mime_type: string | null
}

export type AttachmentEligibilityMediaRow = {
  id: string
  owner_user_id: string | null
  post_id: string | null
  message_id: string | null
  status: "processing" | "ready" | "failed" | null
  processing_status: "processing" | "ready" | "failed" | null
  moderation_status: "pending" | "approved" | "rejected" | "needs_review" | null
}

function toMessageMediaRow(
  item: MessageMediaItemContract
): MessageMediaRow {
  return {
   id: item.media.id,
    message_id: item.messageId,
    storage_path: item.media.storagePath,
    mime_type: item.media.mimeType,
  }
}

async function resolveMediaAssetsFromInputMediaIds(mediaIds: string[]) {
  if (mediaIds.length === 0) {
    return []
  }

  const legacyAssets = await findMediaAssetsByLegacyMediaIds(mediaIds)
  const legacyAssetIds = new Set(legacyAssets.map((asset) => asset.id))
  const legacyMediaIds = new Set(
    legacyAssets
      .map((asset) => asset.legacy_media_id)
      .filter((id): id is string => typeof id === "string")
  )

  const directAssetIds = mediaIds.filter(
    (mediaId) => !legacyMediaIds.has(mediaId)
  )

  const directAssets = await findMediaAssetsByIds(directAssetIds)

  return [
    ...legacyAssets,
    ...directAssets.filter((asset) => !legacyAssetIds.has(asset.id)),
  ]
}

async function resolveMediaAssetIdsFromInputMediaIds(
  mediaIds: string[]
): Promise<string[]> {
  const assets = await resolveMediaAssetsFromInputMediaIds(mediaIds)
  return Array.from(new Set(assets.map((asset) => asset.id)))
}

export async function getMessageMediaRowsByMessageIds(
  messageIds: string[]
): Promise<MessageMediaRow[]> {
  const newRows = await listMessageMedia({
    messageIds,
    requireReadyAsset: true,
  })

  return newRows.map(toMessageMediaRow)
}

export async function getMessageMediaRowsByMessageIdOrEmpty(
  messageId: string
): Promise<MessageMediaRow[]> {
  const newRows = await listMessageMedia({
    messageIds: [messageId],
    requireReadyAsset: true,
  })

  return newRows.map(toMessageMediaRow)
}

export async function getMessageMediaRowsByMessageId(
  messageId: string
): Promise<MessageMediaRow[]> {
  const newRows = await listMessageMedia({
    messageIds: [messageId],
    requireReadyAsset: true,
  })

  return newRows.map(toMessageMediaRow)
}

export async function getMessageAttachmentEligibilityRowsByIds(
  mediaIds: string[]
): Promise<AttachmentEligibilityMediaRow[]> {
  const assets = await resolveMediaAssetsFromInputMediaIds(mediaIds)

  return Promise.all(
    assets.map(async (asset) => {
      const moderation = await getMediaModerationDecision({
        mediaId: asset.id,
      })

      return {
        id: asset.legacy_media_id ?? asset.id,
        owner_user_id: asset.owner_user_id,
        post_id: null,
        message_id: null,
        status:
          asset.processing_status === "failed"
            ? "failed"
            : asset.processing_status === "ready"
              ? "ready"
              : "processing",
        processing_status:
          asset.processing_status === "failed"
            ? "failed"
            : asset.processing_status === "ready"
              ? "ready"
              : "processing",
        moderation_status: moderation.decision ?? null,
      }
    })
  )
}

export async function getModerationMediaRowsByIds(
  mediaIds: string[]
): Promise<ModerationMediaRow[]> {
  const assets = await resolveMediaAssetsFromInputMediaIds(mediaIds)

  return assets.map((asset) => ({
    id: asset.legacy_media_id ?? asset.id,
    storage_path: asset.storage_path,
    mime_type: asset.mime_type,
  }))
}

export async function attachMessageMediaRowsToMessage(input: {
  mediaIds: string[]
  messageId: string
}) {
  const mediaAssetIds = await resolveMediaAssetIdsFromInputMediaIds(
    input.mediaIds
  )

  const rows = []

  for (const mediaAssetId of mediaAssetIds) {
    const binding = await createMessageMediaBinding({
      messageId: input.messageId,
      mediaId: mediaAssetId,
      bindingRole: "attachment",
    })

    const asset = await findMediaAssetById(mediaAssetId)

    rows.push({
      id: asset?.legacy_media_id ?? mediaAssetId,
      message_id: binding.message_id,
    })
  }

  return rows
}