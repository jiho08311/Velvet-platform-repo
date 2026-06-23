import { createPostLikeCompatibilityFields } from "@/shared/lib/like-interaction-result"
import { readPostLikeCount } from "@/shared/lib/post-like-count"
import { buildPostRenderInput } from "@/modules/post/public/post-render-input"
import { assemblePostProjectionRuntime } from "@/modules/post/public/post-projection-runtime"
import type { CreatorPublicCardSearchRow } from "@/modules/search/public/creator-public-card-read-model"
import {
  getPublicFeedCommerceState,
  isRuntimePostBlock,
  mapPostBlocksForRender,
  resolveProjectedFeedAccess,
} from "./home-feed-runtime-mappers"
import type {
  HomeFeedItem,
  HomeFeedMediaRow,
  HomeFeedPostRow,
} from "./home-feed-runtime-types"

export async function buildHomeFeedItem({
  post,
  publicState,
  creator,
  viewerUserId,
  cursor,
  entitlementProjectionObserved,
  likeCountMap,
  myLikeSet,
  commentCountMap,
  mediaRows,
}: {
  post: HomeFeedPostRow
  publicState: "published" | "upcoming"
  creator: CreatorPublicCardSearchRow | undefined
  viewerUserId: string
  cursor: string | null | undefined
  entitlementProjectionObserved: boolean
  likeCountMap: Map<string, number>
  myLikeSet: Set<string>
  commentCountMap: Map<string, number>
  mediaRows: HomeFeedMediaRow[]
}): Promise<HomeFeedItem> {
  const creatorUserId = creator?.user_id ?? ""
  const normalizedBlocks = mapPostBlocksForRender(post)




  if (publicState === "upcoming") {
    const access = resolveProjectedFeedAccess({
      post,
      entitlementProjectionObserved,
    })

    const renderInput = buildPostRenderInput({
      text: post.content ?? post.title ?? "",
      blocks: normalizedBlocks.filter(isRuntimePostBlock),
      media: [],
    })

    const likeState = {
      likesCount: 0,
      viewerHasLiked: false,
    }

    return {
      id: post.id,
      creatorId: post.creator_id,
      status: post.status,
      publishedAt: post.published_at ?? null,
      creatorUserId,
      currentUserId: viewerUserId || undefined,
      text: renderInput.blockText || post.content || post.title || "",
      createdAt: post.created_at,
      renderInput,
      canView: access.canView,
      isLocked: access.isLocked,
      lockReason: access.lockReason,
      commerce: getPublicFeedCommerceState(),
      price: post.price ?? undefined,
      media: [],
      blocks: [],
      ...likeState,
      ...createPostLikeCompatibilityFields(likeState),
      commentsCount: 0,
      creator: {
        username: creator?.username ?? "",
        displayName: creator?.display_name ?? null,
        avatarUrl: creator?.avatar_url ?? null,
      },
    }
  }

  const access = resolveProjectedFeedAccess({
    post,
    entitlementProjectionObserved,
  })

  const projectionRuntime = await assemblePostProjectionRuntime({
    sourceFile: "src/modules/feed/server/get-home-feed.ts",
    sourceSymbol: "getHomeFeed",
    surface: "feed_projection",
    post: {
      id: post.id,
      creatorId: post.creator_id,
      content: post.content ?? post.title ?? "",
      visibility: post.visibility,
    },
    access,
    publicState,
    viewerUserId: viewerUserId || null,
    creatorUserId,
    isSubscribed: false,
    hasPurchased: false,
    blocks: normalizedBlocks.filter(isRuntimePostBlock),
    mediaRows: mediaRows.slice(0, 3),
    correlationKeys: {
      postId: post.id,
      creatorId: post.creator_id,
      viewerUserId,
    },
    metadata: {
      publicState,
      cursor: cursor ?? null,
      entitlementProjectionObserved,
    },
  })

  const likeState = {
    likesCount: readPostLikeCount(likeCountMap, post.id),
    viewerHasLiked: myLikeSet.has(post.id),
  }

  return {
    id: post.id,
    creatorId: post.creator_id,
    status: post.status,
    publishedAt: post.published_at ?? null,
    creatorUserId,
    currentUserId: viewerUserId || undefined,
    text:
      projectionRuntime.renderInput.blockText || post.content || post.title || "",
    createdAt: post.published_at ?? post.created_at,
    renderInput: projectionRuntime.renderInput,
    canView: access.canView,
    isLocked: access.isLocked,
    lockReason: access.lockReason,
    commerce: getPublicFeedCommerceState(),
    price: post.price ?? undefined,
    media: projectionRuntime.selectedMedia,
    blocks: projectionRuntime.selectedBlocks,
    ...likeState,
    ...createPostLikeCompatibilityFields(likeState),
    commentsCount: commentCountMap.get(post.id) ?? 0,
    creator: {
      username: creator?.username ?? "",
      displayName: creator?.display_name ?? null,
      avatarUrl: creator?.avatar_url ?? null,
    },
  }
}
