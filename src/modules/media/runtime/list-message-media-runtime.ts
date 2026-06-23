// src/modules/media/runtime/list-message-media-runtime.ts

import {
  findMessageMediaBindingsByMessageIds,
  type MessageMediaBindingRow,
} from "@/modules/media/repositories/message-media-binding-repository"
import {
  findMediaAssetsByIds,
  type MediaAssetRow,
} from "@/modules/media/repositories/media-asset-repository"
import type { MediaAssetContract } from "@/modules/media/runtime/create-media-asset-runtime"

export type MessageMediaItemContract = {
  messageId: string
  media: MediaAssetContract
  bindingRole: string
}

function mapAssetRowToContract(row: MediaAssetRow): MediaAssetContract {
  return {
    id: row.id,
    legacyMediaId: row.legacy_media_id,
    ownerUserId: row.owner_user_id,
    mediaType: row.media_type,
    mimeType: row.mime_type,
    originalFilename: row.original_filename,
    fileSizeBytes: row.file_size_bytes,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    checksumSha256: row.checksum_sha256,
    processingStatus: row.processing_status,
    sourceSurface: row.source_surface,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toMessageMediaItemContract({
  binding,
  media,
}: {
  binding: MessageMediaBindingRow
  media: MediaAssetContract
}): MessageMediaItemContract {
  return {
    messageId: binding.message_id,
    media,
    bindingRole: binding.binding_role,
  }
}

export async function listMessageMediaRuntime(input: {
  messageIds: string[]
  requireReadyAsset?: boolean
}): Promise<MessageMediaItemContract[]> {
  const bindings = await findMessageMediaBindingsByMessageIds(input.messageIds)

  if (bindings.length === 0) {
    return []
  }

  const mediaIds = Array.from(new Set(bindings.map((item) => item.media_id)))
  const assets = await findMediaAssetsByIds(mediaIds)

  const assetById = new Map(
    assets.map((asset) => [asset.id, mapAssetRowToContract(asset)])
  )

  return bindings
    .map((binding) => {
      const media = assetById.get(binding.media_id)

      if (!media) {
        return null
      }

      if (input.requireReadyAsset && media.processingStatus !== "ready") {
        return null
      }

      return toMessageMediaItemContract({
        binding,
        media,
      })
    })
    .filter((item): item is MessageMediaItemContract => item !== null)
}