import { getBlockedPostCommerceState } from "@/modules/post/policies/post-commerce-policy"
import type {
  PostAccessResult,
  PostCommerceState,
  PostRenderListItem,
  PostRenderSurfaceItem,
} from "@/modules/post/types"
import {
  mapCreatorFeedSurfaceItem,
  mapFeedBlockRowsToRenderBlocks,
  mapSubscribedFeedListItem,
  type FeedMediaRowLike,
  type FeedPostBlockRowLike,
} from "@/modules/post/mappers/post-feed-mapper"
import { createPostLikeCompatibilityFields } from "@/shared/lib/like-interaction-result"
import { assemblePostProjectionRuntime } from "@/modules/post/runtime/post-projection-runtime"

type CreatorFeedPostRowLike = {
  id: string
  creator_id: string
  content: string | null
  created_at: string
  price: number
  visibility: "public" | "subscribers" | "paid"
  status: string
}

type SubscribedFeedPostRowLike = {
  id: string
  creator_id: string
  content: string | null
  status: "draft" | "scheduled" | "published" | "archived"
  visibility: "public" | "subscribers" | "paid"
  price: number
  published_at: string | null
  created_at: string
}

export async function buildCreatorFeedSurfaceItem(params: {
  post: CreatorFeedPostRowLike & {
    publicState: "hidden" | "upcoming" | "published"
    hasPurchased: boolean
    isSubscribed: boolean
    canView: boolean
    isLocked: boolean
    lockReason: PostAccessResult["lockReason"]
    commerce: PostCommerceState
    access: PostAccessResult
  }
  mediaRows: FeedMediaRowLike[]
  blockRows: FeedPostBlockRowLike[]
  viewerUserId: string | null
  creatorUserId: string
  likeState: {
    likesCount: number
    viewerHasLiked: boolean
  }
  commentsCount: number
}): Promise<PostRenderSurfaceItem> {
  const projectionRuntime = await assemblePostProjectionRuntime({
    sourceFile: "src/modules/post/services/post-feed-render-service.ts",
    sourceSymbol: "buildCreatorFeedSurfaceItem",
    surface: "feed_projection",
    post: {
      id: params.post.id,
      creatorId: params.post.creator_id,
      content: params.post.content,
      visibility: params.post.visibility,
    },
    access: params.post.access,
    publicState: params.post.publicState,
    viewerUserId: params.viewerUserId,
    creatorUserId: params.creatorUserId,
    isSubscribed: params.post.isSubscribed,
    hasPurchased: params.post.hasPurchased,
    blocks: mapFeedBlockRowsToRenderBlocks(params.blockRows),
    mediaRows: params.mediaRows,
    correlationKeys: {
      postId: params.post.id,
      creatorId: params.post.creator_id,
      viewerUserId: params.viewerUserId,
    },
  })

  return mapCreatorFeedSurfaceItem({
    post: {
      ...params.post,
      status: params.post.status as PostRenderSurfaceItem["status"],
    },
    renderInput: projectionRuntime.renderInput,
    media: projectionRuntime.selectedMedia,
    blocks: projectionRuntime.selectedBlocks,
    likeState: params.likeState,
    likeCompatibilityFields: createPostLikeCompatibilityFields(
      params.likeState,
    ),
    commentsCount: params.commentsCount,
  })
}

export async function buildSubscribedFeedListItem(params: {
  post: SubscribedFeedPostRowLike
  access: PostAccessResult
  mediaRows: FeedMediaRowLike[]
  blockRows: FeedPostBlockRowLike[]
  viewerUserId: string
  creatorUserId: string
  likeState: {
    likesCount: number
    viewerHasLiked: boolean
  }
}): Promise<PostRenderListItem> {
  const projectionRuntime = await assemblePostProjectionRuntime({
    sourceFile: "src/modules/post/services/post-feed-render-service.ts",
    sourceSymbol: "buildSubscribedFeedListItem",
    surface: "feed_projection",
    post: {
      id: params.post.id,
      creatorId: params.post.creator_id,
      content: params.post.content,
      visibility: params.post.visibility,
    },
    access: params.access,
    publicState: "published",
    viewerUserId: params.viewerUserId,
    creatorUserId: params.creatorUserId,
    isSubscribed: true,
    hasPurchased: false,
    blocks: mapFeedBlockRowsToRenderBlocks(params.blockRows),
    // Preserve the legacy subscribed-feed behavior: only sign/render up to 3 media rows.
    mediaRows: params.mediaRows.slice(0, 3),
    correlationKeys: {
      postId: params.post.id,
      creatorId: params.post.creator_id,
      viewerUserId: params.viewerUserId,
    },
  })

  return {
    ...mapSubscribedFeedListItem({
      post: params.post,
      access: params.access,
      commerce: getBlockedPostCommerceState({
        blockingReason: "not_paid_post",
        hasPurchased: false,
        isSubscribed: true,
      }),
      renderInput: projectionRuntime.renderInput,
      media: projectionRuntime.selectedMedia,
    }),
    ...params.likeState,
    ...createPostLikeCompatibilityFields(params.likeState),
  } as PostRenderListItem
}
