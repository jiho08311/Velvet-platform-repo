import type {
  PostBlockEditorState,
  PostEditorMediaType,
  PostRenderListItem,
  PostRenderSurfaceItem,
} from "@/modules/post/types"

export type FeedMediaRowLike = {
  id: string
  post_id: string
  storage_path: string
  type: string | null
  mime_type: string | null
  sort_order: number
}

export type FeedPostBlockRowLike = {
  id: string
  post_id: string
  type: "text" | "image" | "video" | "audio" | "file"
  content: string | null
  media_id: string | null
  sort_order: number
  created_at: string
  editor_state: PostBlockEditorState | null
}

export type FeedRenderableBlock = {
  id: string
  postId: string
  type: FeedPostBlockRowLike["type"]
  content: string | null
  mediaId: string | null
  sortOrder: number
  createdAt: string
  editorState: FeedPostBlockRowLike["editor_state"]
}

export type SignedFeedMediaItem = {
  id: string
  url: string
  type: PostEditorMediaType
  mimeType: string | null
  sortOrder: number
}

export function resolveFeedMediaType(row: FeedMediaRowLike): PostEditorMediaType {
  if (
    row.type === "image" ||
    row.type === "video" ||
    row.type === "audio" ||
    row.type === "file"
  ) {
    return row.type
  }

  if (typeof row.mime_type === "string") {
    if (row.mime_type.startsWith("image/")) return "image"
    if (row.mime_type.startsWith("video/")) return "video"
    if (row.mime_type.startsWith("audio/")) return "audio"
  }

  return "file"
}

export function groupFeedMediaRowsByPostId(
  rows: FeedMediaRowLike[]
): Map<string, FeedMediaRowLike[]> {
  const map = new Map<string, FeedMediaRowLike[]>()

  for (const row of rows) {
    const current = map.get(row.post_id) ?? []
    current.push(row)
    map.set(row.post_id, current)
  }

  return map
}

export function groupFeedBlockRowsByPostId(
  rows: FeedPostBlockRowLike[]
): Map<string, FeedPostBlockRowLike[]> {
  const map = new Map<string, FeedPostBlockRowLike[]>()

  for (const row of rows) {
    const current = map.get(row.post_id) ?? []
    current.push(row)
    map.set(row.post_id, current)
  }

  return map
}

export function mapFeedBlockRowsToRenderBlocks(
  rows: FeedPostBlockRowLike[]
): FeedRenderableBlock[] {
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

export function mapSignedFeedMediaItem(
  item: SignedFeedMediaItem
): SignedFeedMediaItem {
  return {
    id: item.id,
    url: item.url,
    type: item.type,
    mimeType: item.mimeType,
    sortOrder: item.sortOrder,
  }
}

export function mapSignedFeedMediaItems(
  items: SignedFeedMediaItem[]
): SignedFeedMediaItem[] {
  return items.map(mapSignedFeedMediaItem)
}

export function mapCreatorFeedSurfaceItem(params: {
  post: {
    id: string
    creator_id: string
    content: string | null
    created_at: string
    price: number
    visibility: PostRenderSurfaceItem["visibility"]
    status: PostRenderSurfaceItem["status"]
    published_at?: string | null
    canView: boolean
    isLocked: boolean
    lockReason: PostRenderSurfaceItem["lockReason"]
    commerce: PostRenderSurfaceItem["commerce"]
    access: {
      canView: boolean
    }
  }
  renderInput: PostRenderSurfaceItem["renderInput"]
  media: PostRenderSurfaceItem["media"]
  blocks: PostRenderSurfaceItem["blocks"]
  likeState: {
    likesCount: number
    viewerHasLiked: boolean
  }
  likeCompatibilityFields: {
    isLiked: boolean
  }
  commentsCount: number
}): PostRenderSurfaceItem {
  return {
    id: params.post.id,
    creatorId: params.post.creator_id,
    content: params.post.access.canView
      ? (params.renderInput.blockText || null)
      : null,
    createdAt: params.post.created_at,
    renderInput: params.renderInput,
    media: params.media,
    blocks: params.post.access.canView ? params.blocks : [],
    price: params.post.price,
    canView: params.post.canView,
    isLocked: params.post.isLocked,
    lockReason: params.post.lockReason,
    commerce: params.post.commerce,
    ...params.likeState,
    ...params.likeCompatibilityFields,
    visibility: params.post.visibility,
    commentsCount: params.commentsCount,
    status: params.post.status,
    publishedAt: params.post.published_at ?? null,
  }
}

export function mapSubscribedFeedListItem(params: {
  post: {
    id: string
    creator_id: string
    content: string | null
    status: PostRenderListItem["status"]
    visibility: PostRenderListItem["visibility"]
    price: number
    published_at: string | null
    created_at: string
  }
  access: {
    canView: boolean
    isLocked: boolean
    lockReason: PostRenderListItem["lockReason"]
  }
  commerce: PostRenderListItem["commerce"]
  renderInput: PostRenderListItem["renderInput"]
  media: PostRenderListItem["media"]
}): PostRenderListItem {
  return {
    id: params.post.id,
    creatorId: params.post.creator_id,
    content: params.renderInput.blockText || null,
    status: params.post.status,
    visibility: params.post.visibility,
    price: params.post.price,
    canView: params.access.canView,
    isLocked: params.access.isLocked,
    lockReason: params.access.lockReason,
    commerce: params.commerce,
    publishedAt: params.post.published_at ?? null,
    createdAt: params.post.created_at,
    renderInput: params.renderInput,
    media: params.media,
  }
}