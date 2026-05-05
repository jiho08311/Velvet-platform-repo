import { createPostLikeCompatibilityFields } from "@/shared/lib/like-interaction-result"
import type {
  PostBlock,
  PostCommerceState,
  PostRenderInput,
} from "@/modules/post/types"
import type { PostDetailMediaItem } from "@/modules/post/mappers/post-media-mapper"

type PostDetailPostRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price: number | null
  status: "draft" | "scheduled" | "published" | "archived"
  created_at: string
  published_at: string | null
}

type PostDetailCreatorRow = {
  user_id: string
  username: string
  display_name: string | null
}

export type MapPostDetailParams = {
  post: PostDetailPostRow
  creator: PostDetailCreatorRow
  canView: boolean
  isLocked: boolean
  lockReason: "none" | "subscription" | "purchase"
  commerce: PostCommerceState
  likesCount: number
  viewerHasLiked: boolean
  commentsCount: number | null
  selectedMedia: PostDetailMediaItem[]
  selectedBlocks: PostBlock[]
  renderInput: PostRenderInput
}

export function mapPostDetail(params: MapPostDetailParams) {
  const likeState = {
    likesCount: params.likesCount,
    viewerHasLiked: params.viewerHasLiked,
  }

  return {
    id: params.post.id,
    creatorId: params.post.creator_id,
    creatorUserId: params.creator.user_id,
    creator: {
      username: params.creator.username,
      displayName: params.creator.display_name,
    },
    title: params.post.title,
    content: params.canView ? (params.renderInput.blockText || null) : null,
    visibility: params.post.visibility,
    price: params.post.price,
    status: params.post.status,
    createdAt: params.post.created_at,
    publishedAt: params.post.published_at,
    canView: params.canView,
    isLocked: params.isLocked,
    lockReason: params.lockReason,
    commerce: params.commerce,
    ...likeState,
    ...createPostLikeCompatibilityFields(likeState),
    commentsCount: params.commentsCount ?? 0,
    media: params.canView ? params.selectedMedia : [],
    blocks: params.canView ? params.selectedBlocks : [],
    renderInput: params.renderInput,
  }
}