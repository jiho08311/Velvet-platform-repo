import { listPostMedia } from "@/modules/media/public/list-post-media"
import type { PostMediaItemContract } from "@/modules/media/public/list-post-media"

export type ReadyPostMediaRow = {
  id: string
  post_id: string
  type: "image" | "video" | "audio" | "file"
  storage_path: string
  mime_type: string | null
  sort_order: number
  status: "processing" | "ready" | "failed"
}

export type ReadyExplorePostMediaRow = ReadyPostMediaRow

function toReadyPostMediaRow(
  item: PostMediaItemContract
): ReadyPostMediaRow {
  return {
  id: item.media.id,
    post_id: item.postId,
    type: item.media.mediaType,
    storage_path: item.media.storagePath,
    mime_type: item.media.mimeType,
    sort_order: item.sortOrder,
    status:
      item.media.processingStatus === "failed"
        ? "failed"
        : item.media.processingStatus === "ready"
          ? "ready"
          : "processing",
  }
}

function toReadyExplorePostMediaRow(
  item: PostMediaItemContract
): ReadyExplorePostMediaRow {
  return toReadyPostMediaRow(item)
}

export async function getReadyPostMediaRowsByPostIds(
  postIds: string[]
): Promise<ReadyPostMediaRow[]> {
  const newRows = await listPostMedia({
    postIds,
    requireReadyAsset: true,
  })

  return newRows.map(toReadyPostMediaRow)
}

export async function getReadyExplorePostMediaRowsByPostIds(
  postIds: string[]
): Promise<ReadyExplorePostMediaRow[]> {
  const newRows = await listPostMedia({
    postIds,
    requireReadyAsset: true,
  })

  return newRows.map(toReadyExplorePostMediaRow)
}