import { createMediaSignedUrl } from "@/modules/media/public/create-media-signed-url"

import { buildPostRenderInput } from "@/modules/post/lib/post-render-input"
import { getBlockedPostCommerceState } from "@/modules/post/policies/post-commerce-policy"
import { buildLockedPreviewPolicy } from "@/modules/post/server/locked-preview-policy"
import { buildPostRenderReadModel } from "@/modules/post/server/post-render-read-model"
import type {
  PostAccessResult,
  PostCommerceState,
  PostRenderListItem,
  PostRenderSurfaceItem,
} from "@/modules/post/types"
import {
  mapCreatorFeedSurfaceItem,
  mapFeedBlockRowsToRenderBlocks,
  mapSignedFeedMediaItems,
  mapSubscribedFeedListItem,
  resolveFeedMediaType,
  type FeedMediaRowLike,
  type FeedPostBlockRowLike,
} from "@/modules/post/mappers/post-feed-mapper"
import { createPostLikeCompatibilityFields } from "@/shared/lib/like-interaction-result"





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
  const allBlocks = mapFeedBlockRowsToRenderBlocks(params.blockRows)
  const allMediaRows = params.mediaRows

  const previewPolicy = buildLockedPreviewPolicy({
    access: params.post.access,
    publicState: params.post.publicState,
    text: params.post.content ?? "",
    blocks: allBlocks,
    media: allMediaRows.map((item) => ({
      id: item.id,
      url: "",
      type: resolveFeedMediaType(item),
      mimeType: item.mime_type,
      sortOrder: item.sort_order,
    })),
  })

  const selectedMediaRows = params.post.access.canView
    ? allMediaRows
    : allMediaRows.filter((item) =>
        previewPolicy.previewMedia.some((preview) => preview.id === item.id)
      )

  const signedMedia = await Promise.all(
    selectedMediaRows.map(async (item) => {
      const url = await createMediaSignedUrl({
        storagePath: item.storage_path,
        viewerUserId: params.viewerUserId,
        creatorUserId: params.creatorUserId,
        visibility: params.post.visibility,
        canView: params.post.access.canView,
        isSubscribed: params.post.isSubscribed,
        hasPurchased: params.post.hasPurchased,
        allowPreview:
          !params.post.access.canView &&
          previewPolicy.allowPreviewMediaSigning,
      })

      return {
        id: item.id,
        url,
        type: resolveFeedMediaType(item),
        mimeType: item.mime_type,
        sortOrder: item.sort_order,
      }
    })
  )

  const media = mapSignedFeedMediaItems(signedMedia)

  const selectedBlocks = params.post.access.canView
    ? allBlocks
    : previewPolicy.previewBlocks

  const renderReadModel = buildPostRenderReadModel({
    blockRows: selectedBlocks.map((block) => ({
      id: block.id,
      post_id: block.postId,
      type: block.type,
      content: block.content,
      media_id: block.mediaId,
      sort_order: block.sortOrder,
      created_at: block.createdAt,
      editor_state: block.editorState ?? null,
    })),
    mediaItems: media,
  })

  const renderInput = buildPostRenderInput({
    text: params.post.access.canView
      ? (params.post.content ?? "")
      : previewPolicy.renderTextSeed,
    blocks: renderReadModel.blocks,
    media: renderReadModel.media,
  })

  return mapCreatorFeedSurfaceItem({
    post: {
      ...params.post,
      status: params.post.status as PostRenderSurfaceItem["status"],
    },
    renderInput,
    media,
    blocks: renderReadModel.blocks,
    likeState: params.likeState,
    likeCompatibilityFields: createPostLikeCompatibilityFields(
      params.likeState
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
  const selectedMediaRows = params.mediaRows.slice(0, 3)

  const signedMedia = await Promise.all(
    selectedMediaRows.map(async (item) => {
      const url = await createMediaSignedUrl({
        storagePath: item.storage_path,
        viewerUserId: params.viewerUserId,
        creatorUserId: params.creatorUserId,
        visibility: params.post.visibility,
        canView: params.access.canView,
        isSubscribed: true,
        hasPurchased: false,
      })

      return {
        id: item.id,
        url,
        type: resolveFeedMediaType(item),
        mimeType: item.mime_type,
        sortOrder: item.sort_order,
      }
    })
  )

  const media = mapSignedFeedMediaItems(signedMedia)

  const renderReadModel = buildPostRenderReadModel({
    blockRows: params.blockRows,
    mediaItems: media,
  })

  const renderInput = buildPostRenderInput({
    text: params.post.content ?? "",
    blocks: renderReadModel.blocks,
    media: renderReadModel.media,
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
      renderInput,
      media,
    }),
    ...params.likeState,
    ...createPostLikeCompatibilityFields(params.likeState),
  } as PostRenderListItem
}