import type { PostRenderMediaItem } from "@/modules/post/types"

type PostMediaRowLike = {
  id: string
  post_id: string
  storage_path: string
  type: "image" | "video" | "audio" | "file"
  mime_type: string | null
  sort_order: number
}

export type PostDetailMediaItem = {
  id: string
  postId: string
  type: "image" | "video" | "audio" | "file"
  url: string
  mimeType: string | null
  sortOrder: number
}

export function sortPostMediaRows(rows: PostMediaRowLike[]): PostMediaRowLike[] {
  return [...rows].sort((a, b) => a.sort_order - b.sort_order)
}

export function mapPostMediaRowsToPreviewMedia(
  rows: PostMediaRowLike[]
): PostRenderMediaItem[] {
  return rows.map((item) => ({
    id: item.id,
    url: "",
    type: item.type,
    mimeType: item.mime_type,
    sortOrder: item.sort_order,
  }))
}

export function selectPostMediaRowsForAccess(params: {
  canView: boolean
  sortedMediaRows: PostMediaRowLike[]
  previewMedia: PostRenderMediaItem[]
}): PostMediaRowLike[] {
  if (params.canView) {
    return params.sortedMediaRows
  }

  return params.sortedMediaRows.filter((item) =>
    params.previewMedia.some((preview) => preview.id === item.id)
  )
}

export function mapSignedPostMediaItem(params: {
  row: PostMediaRowLike
  url: string
}): PostDetailMediaItem {
  return {
    id: params.row.id,
    postId: params.row.post_id,
    type: params.row.type,
    url: params.url,
    mimeType: params.row.mime_type,
    sortOrder: params.row.sort_order,
  }
}

export function mapPostDetailMediaToRenderMedia(
  media: PostDetailMediaItem[]
): PostRenderMediaItem[] {
  return media.map((item) => ({
    id: item.id,
    url: item.url,
    type: item.type,
    mimeType: item.mimeType,
    sortOrder: item.sortOrder,
  }))
}