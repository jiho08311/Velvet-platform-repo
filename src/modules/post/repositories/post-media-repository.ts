import { listPostMedia } from "@/modules/media/public/list-post-media"
import { deletePostMediaBinding } from "@/modules/media/public/post-media-binding"
import { findMediaAssetsByLegacyMediaIds } from "@/modules/media/public/media-asset-lookup"
import { getMediaModerationDecision } from "@/modules/media/public/media-moderation"

export type PostMediaRow = {
  id: string
  post_id: string
  type: "image" | "video" | "audio" | "file"
  storage_path: string
  mime_type: string | null
  sort_order: number
  status: "processing" | "ready" | "failed"
}

export type PostMediaModerationStatusRow = {
  moderation_status: string | null
}

export type MyPostsMediaRow = {
  id: string
  post_id: string
  storage_path: string
  type: "image" | "video" | "audio" | "file" | null
  mime_type: string | null
  sort_order: number
  status: "processing" | "ready" | "failed"
}

function toPostMediaRow(item: Awaited<ReturnType<typeof listPostMedia>>[number]): PostMediaRow {
  return {
    id: item.media.id,
    post_id: item.postId,
    type: item.media.mediaType,
    storage_path: item.media.storagePath,
    mime_type: item.media.mimeType,
    sort_order: item.sortOrder,
    status: item.media.processingStatus === "failed" ? "failed" : item.media.processingStatus === "ready" ? "ready" : "processing",
  }
}

function toMyPostsMediaRow(item: Awaited<ReturnType<typeof listPostMedia>>[number]): MyPostsMediaRow {
  const row = toPostMediaRow(item)

  return {
    id: row.id,
    post_id: row.post_id,
    storage_path: row.storage_path,
    type: row.type,
    mime_type: row.mime_type,
    sort_order: row.sort_order,
    status: row.status,
  }
}

export async function findMyPostMediaRowsByPostIds(
  postIds: string[]
): Promise<MyPostsMediaRow[]> {
  const rows = await listPostMedia({
    postIds,
    requireReadyAsset: false,
  })

  return rows
    .filter((item) =>
      item.media.processingStatus === "processing" ||
      item.media.processingStatus === "ready"
    )
    .map(toMyPostsMediaRow)
}

export async function deletePostMediaRowsByIds({
  postId,
  mediaIds,
}: {
  postId: string
  mediaIds: string[]
}): Promise<void> {
  if (mediaIds.length === 0) {
    return
  }

  const assets = await findMediaAssetsByLegacyMediaIds(mediaIds)
  const legacyMediaIdSet = new Set(
    assets
      .map((asset) => asset.legacy_media_id)
      .filter((id): id is string => typeof id === "string")
  )

  const mediaAssetIds = [
    ...assets.map((asset) => asset.id),
    ...mediaIds.filter((mediaId) => !legacyMediaIdSet.has(mediaId)),
  ]

  for (const mediaId of Array.from(new Set(mediaAssetIds))) {
    await deletePostMediaBinding({
      postId,
      mediaId,
    })
  }
}

export async function findPostMediaModerationStatusesByPostId(
  postId: string
): Promise<PostMediaModerationStatusRow[]> {
  const rows = await listPostMedia({
    postIds: [postId],
    requireReadyAsset: false,
  })

  return Promise.all(
    rows.map(async (item) => {
      const decision = await getMediaModerationDecision({
        mediaId: item.media.id,
      })

      return {
        moderation_status: decision.decision,
      }
    })
  )
}

export async function findPostMediaRowsByPostId(
  postId: string
): Promise<PostMediaRow[]> {
  const rows = await listPostMedia({
    postIds: [postId],
    requireReadyAsset: false,
  })

  return rows
    .filter((item) =>
      item.media.processingStatus === "processing" ||
      item.media.processingStatus === "ready"
    )
    .map(toPostMediaRow)
}

export async function findReadyPostMediaRowsByPostId(
  postId: string
): Promise<PostMediaRow[]> {
  const rows = await listPostMedia({
    postIds: [postId],
    requireReadyAsset: true,
  })

  return rows.map(toPostMediaRow)
}

export async function findReadyPostMediaRowsByPostIds(
  postIds: string[]
): Promise<PostMediaRow[]> {
  const rows = await listPostMedia({
    postIds,
    requireReadyAsset: true,
  })

  return rows.map(toPostMediaRow)
}