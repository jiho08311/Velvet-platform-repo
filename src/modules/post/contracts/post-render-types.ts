import type {
  PostAccessLockReason,
  PostBlock,
  PostBlockType,
  PostCommerceState,
  PostStatus,
  PostVisibility,
} from "./post-core-types"
import type { PostEditorMediaType } from "./post-editor-types"

export type PostRenderMediaType = Exclude<PostBlockType, "text">

export type PostRenderMediaItem = {
  id?: string
  url: string
  type: PostRenderMediaType
  mimeType?: string | null
  sortOrder?: number
}

export type PostRenderMediaEntry = {
  media: PostRenderMediaItem
  block?: PostBlock
}

export type PostNormalizedRenderTextGroup = {
  type: "text"
  block: PostBlock
}

export type PostNormalizedRenderMediaGroup = {
  type: "media"
  variant: "single" | "carousel"
  blocks: PostBlock[]
  mediaEntries: PostRenderMediaEntry[]
}

export type PostNormalizedRenderGroup =
  | PostNormalizedRenderTextGroup
  | PostNormalizedRenderMediaGroup

export type PostRenderInput = {
  hasBlocks: boolean
  resolvedMedia: PostRenderMediaItem[]
  normalizedGroups: PostNormalizedRenderGroup[]
  blockText: string
  blockMedia: PostRenderMediaItem[]
  resolvedMediaEntries: PostRenderMediaEntry[]
  lockedPreviewText: string
  primaryLockedPreviewMedia: PostRenderMediaItem | null
}

export type PostRenderSurfaceItem = {
  id: string
  creatorId: string
  content: string | null
  createdAt: string
  renderInput: PostRenderInput
  media: Array<{
    id?: string
    url: string
    type: PostEditorMediaType
    mimeType?: string | null
    sortOrder?: number
  }>
  blocks: PostBlock[]
  price: number
  canView: boolean
  isLocked: boolean
  lockReason?: PostAccessLockReason
  commerce: PostCommerceState
  viewerHasLiked: boolean
  isLiked: boolean
  likesCount: number
  commentsCount: number
  visibility: PostVisibility
  status: PostStatus
  publishedAt: string | null
}

export type PostRenderListItem = {
  id: string
  creatorId: string
  content: string | null
  renderInput: PostRenderInput
  status: PostStatus
  visibility: PostVisibility
  price: number
  canView: boolean
  isLocked: boolean
  lockReason?: PostAccessLockReason
  commerce: PostCommerceState
  createdAt: string
  publishedAt: string | null
  media: Array<{
    id?: string
    url: string
    type: PostEditorMediaType
    mimeType?: string | null
    sortOrder?: number
  }>
}
