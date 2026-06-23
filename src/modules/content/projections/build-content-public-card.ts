import { createHash } from "node:crypto"
import type { FeedProjectionBlockReadModel } from "@/modules/post/public/list-feed-projection-blocks"
import type { ReadyPostMediaRow } from "@/modules/media/public/ready-post-media-contract"

export type ContentPublicCardSource = {
  feedItem: {
    post_id: string
    creator_id: string
    title: string | null
    content: string | null
    visibility: string
    status: string
    price: number | null
    published_at: string | null
    created_at: string
    updated_at: string | null
    visibility_status: string | null
    moderation_status: string | null
    feed_visibility_state: string | null
    is_feed_visible: boolean
    deleted_at: string | null
  }
  mediaRows: ReadyPostMediaRow[]
  blockRows: FeedProjectionBlockReadModel[]
}

function hashSource(value: unknown) {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")
}

function toMediaPreview(rows: ReadyPostMediaRow[]) {
  return rows
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 3)
    .map((row) => ({
      id: row.id,
      storagePath: row.storage_path,
      type: row.type,
      mimeType: row.mime_type,
      sortOrder: row.sort_order,
    }))
}

function toBlockPreview(rows: FeedProjectionBlockReadModel[]) {
  return rows
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 5)
    .map((row) => ({
      id: row.id,
      type: row.type,
      content: row.content,
      mediaId: row.mediaId,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      editorState: row.editorState,
    }))
}

export function buildContentPublicCard(source: ContentPublicCardSource) {
  const feedItem = source.feedItem
  const sortedBlocks = [...source.blockRows].sort(
    (a, b) => a.sortOrder - b.sortOrder
  )

  const renderTextSeed =
    sortedBlocks.find((block) => block.type === "text" && block.content?.trim())
      ?.content ??
    feedItem.content ??
    feedItem.title ??
    null

  const isPublicVisible =
    feedItem.deleted_at == null &&
    feedItem.is_feed_visible === true &&
    feedItem.status === "published" &&
    feedItem.visibility === "public"

  return {
    post_id: feedItem.post_id,
    creator_id: feedItem.creator_id,
    title: feedItem.title,
    content: feedItem.content,
    visibility: feedItem.visibility,
    status: feedItem.status,
    price: feedItem.price,
    published_at: feedItem.published_at,
    created_at: feedItem.created_at,
    updated_at: feedItem.updated_at,
    visibility_status: feedItem.visibility_status,
    moderation_status: feedItem.moderation_status,
    feed_visibility_state: feedItem.feed_visibility_state,
    is_feed_visible: feedItem.is_feed_visible,
    is_public_visible: isPublicVisible,
    media_preview: toMediaPreview(source.mediaRows),
    media_count: source.mediaRows.length,
    block_preview: toBlockPreview(source.blockRows),
    block_count: source.blockRows.length,
    render_text_seed: renderTextSeed,
    source_hash: hashSource(source),
    projection_version: 1,
  }
}
