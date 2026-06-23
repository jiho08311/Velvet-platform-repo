// src/modules/media/runtime/list-post-media-runtime.ts

import {
  findPostMediaBindingsByPostIds,
  type PostMediaBindingRow,
} from "@/modules/media/repositories/post-media-binding-repository"
import {
  findMediaAssetsByIds,
  type MediaAssetRow,
} from "@/modules/media/repositories/media-asset-repository"
import type {
  MediaAssetContract,
} from "@/modules/media/runtime/create-media-asset-runtime"

export type PostMediaItemContract = {
  postId: string
  blockId: string | null
  media: MediaAssetContract
  bindingRole: string
  sortOrder: number
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

function toPostMediaItemContract({
  binding,
  media,
}: {
  binding: PostMediaBindingRow
  media: MediaAssetContract
}): PostMediaItemContract {
  return {
    postId: binding.post_id,
    blockId: binding.block_id,
    media,
    bindingRole: binding.binding_role,
    sortOrder: binding.sort_order,
  }
}

export async function listPostMediaRuntime(input: {
  postIds: string[]
  requireReadyAsset?: boolean
}): Promise<PostMediaItemContract[]> {
  const bindings = await findPostMediaBindingsByPostIds(input.postIds)

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

      return toPostMediaItemContract({
        binding,
        media,
      })
    })
    .filter((item): item is PostMediaItemContract => item !== null)
}