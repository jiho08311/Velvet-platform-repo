import type {
  PostBlock,
  PostBlockEditorState,
  PostCommerceState,
  PostRenderInput,
} from "@/modules/post/types"
import type { ReadyPostMediaRow } from "@/modules/media/public/ready-post-media-contract"

export type MediaType = "image" | "video" | "audio" | "file"
export type PostBlockType = "text" | "image" | "video" | "audio" | "file"

export type HomeFeedItem = {
  id: string
  creatorId: string
  creatorUserId?: string
  currentUserId?: string
  text: string
  createdAt: string
  renderInput: PostRenderInput
  canView: boolean
  isLocked: boolean
  status?: "draft" | "scheduled" | "published" | "archived"
  publishedAt?: string | null
  lockReason?: "none" | "subscription" | "purchase"
  commerce: PostCommerceState
  price?: number
  media?: Array<{
    id: string
    url: string
    type: MediaType
  }>
  blocks?: PostBlock[]
  likesCount: number
  viewerHasLiked: boolean
  isLiked: boolean
  commentsCount: number
  creator: {
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
}

export type GetHomeFeedInput = {
  viewerUserId?: string
  limit?: number
  cursor?: string | null
}

export type GetHomeFeedResult = {
  items: HomeFeedItem[]
  nextCursor: string | null
}

export type HomeFeedPostRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  status: "draft" | "scheduled" | "published" | "archived"
  price: number | null
  created_at: string
  published_at: string | null
  visibility_status: "draft" | "published" | "processing" | "rejected" | null
  moderation_status: "pending" | "approved" | "rejected" | null
  deleted_at: string | null
  post_blocks?: Array<{
    id: string
    post_id: string
    type: PostBlockType
    content: string | null
    media_id: string | null
    sort_order: number
    created_at: string
    editor_state: PostBlockEditorState | null
  }>
}

export type HomeFeedMediaRow = ReadyPostMediaRow

export type RuntimePostBlock = PostBlock & {
  type: "text" | "image" | "video" | "audio" | "file"
}
