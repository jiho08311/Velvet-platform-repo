import type {
  PostBlock,
  PostBlockEditorState,
  PostEditorMediaType,
  PostRenderMediaItem,
} from "../types"

type PostBlockRowLike = {
  id: string
  post_id: string
  type: "text" | "image" | "video" | "audio" | "file"
  content: string | null
  media_id: string | null
  sort_order: number
  created_at: string
  editor_state: PostBlockEditorState | unknown | null
}

type PostRenderMediaItemLike = {
  id?: string
  url: string
  type: PostEditorMediaType
  mimeType?: string | null
  sortOrder?: number
}

type BuildPostRenderReadModelParams = {
  blockRows: PostBlockRowLike[]
  mediaItems: PostRenderMediaItemLike[]
}

export function mapPostBlockRowsToRenderBlocks(
  rows: PostBlockRowLike[]
): PostBlock[] {
  return rows.map((block) => ({
    id: block.id,
    postId: block.post_id,
    type: block.type,
    content: block.content,
    mediaId: block.media_id,
    sortOrder: block.sort_order,
    createdAt: block.created_at,
    editorState: block.editor_state ?? null,
  }))
}

export function mapItemsToPostRenderMedia(
  items: PostRenderMediaItemLike[]
): PostRenderMediaItem[] {
  return items.map((item) => ({
    id: item.id,
    url: item.url,
    type: item.type,
    mimeType: item.mimeType,
    sortOrder: item.sortOrder,
  }))
}

export function buildPostRenderReadModel(
  params: BuildPostRenderReadModelParams
): {
  blocks: PostBlock[]
  media: PostRenderMediaItem[]
} {
  return {
    blocks: mapPostBlockRowsToRenderBlocks(params.blockRows),
    media: mapItemsToPostRenderMedia(params.mediaItems),
  }
}
