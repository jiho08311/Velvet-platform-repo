import { createPostLikeCompatibilityFields } from "@/shared/lib/like-interaction-result"
import { readPostLikeCount } from "@/shared/lib/post-like-count"
import { buildPostRenderInput } from "@/modules/post/public/post-render-input"
import { buildPostRenderReadModel } from "@/modules/post/public/post-render-read-model"
import { getPostAccess } from "@/modules/post/public/get-post-access"
import { assemblePostProjectionRuntime } from "@/modules/post/public/post-projection-runtime"
import { canAccessPost } from "@/modules/commerce/public/entitlement-contract"
import { mapCreatorPageBlocks } from "./creator-page-runtime-mappers"
import type {
  CreatorPageBlockRow,
  CreatorPageIdentity,
  CreatorPageMediaRow,
  CreatorPagePostRow,
} from "./creator-page-runtime-types"

export async function buildCreatorPagePurchasedSet({
  viewerUserId,
  postIds,
}: {
  viewerUserId?: string | null
  postIds: string[]
}): Promise<Set<string>> {
  if (!viewerUserId || postIds.length === 0) {
    return new Set()
  }

  const decisions = await Promise.all(
    postIds.map(async (postId) => {
      const { decision } = await canAccessPost({
        viewerUserId,
        postId,
      })

      return {
        postId,
        allowed: decision.allowed,
      }
    })
  )

  return new Set(
    decisions
      .filter((decision) => decision.allowed)
      .map((decision) => decision.postId)
  )
}

export async function buildCreatorPagePostItem({
  post,
  creator,
  identity,
  viewerUserId,
  isSubscribed,
  hasPurchased,
  blocks,
  mediaRows,
  likeCountMap,
  myLikeSet,
  commentCountMap,
}: {
  post: CreatorPagePostRow
  creator: {
    id: string
    user_id: string
  }
  identity: CreatorPageIdentity
  viewerUserId?: string | null
  isSubscribed: boolean
  hasPurchased: boolean
  blocks: CreatorPageBlockRow[]
  mediaRows: CreatorPageMediaRow[]
  likeCountMap: Map<string, number>
  myLikeSet: Set<string>
  commentCountMap: Map<string, number>
}) {
  const isScheduled = post.status === "scheduled"
  const mappedBlocks = mapCreatorPageBlocks(blocks)
  const renderReadModel = buildPostRenderReadModel({
    blockRows: blocks.map((block) => ({
      id: block.id,
      post_id: block.postId,
      type: block.type,
      content: block.content,
      media_id: block.mediaId,
      sort_order: block.sortOrder,
      created_at: block.createdAt,
      editor_state: block.editorState,
    })),
    mediaItems: [],
  })

  const scheduledRenderInput = buildPostRenderInput({
    text: post.content ?? "",
    blocks: renderReadModel.blocks,
    media: renderReadModel.media,
  })

  if (isScheduled) {
    const likeState = {
      likesCount: 0,
      viewerHasLiked: false,
    }

    return {
      id: post.id,
      text: scheduledRenderInput.blockText || "",
      canView: true,
      isLocked: false,
      lockReason: "none" as const,
      price: post.price,
      media: [],
      blocks: renderReadModel.blocks,
      renderInput: scheduledRenderInput,
      createdAt: post.created_at,
      publishedAt: post.published_at,
      status: post.status,
      visibility: post.visibility,
      ...likeState,
      ...createPostLikeCompatibilityFields(likeState),
      commentsCount: 0,
      creatorId: creator.id,
      creatorUserId: creator.user_id,
      currentUserId: viewerUserId ?? null,
      creator: {
        username: identity.username,
        displayName: identity.displayName,
        avatarUrl: identity.avatarUrl,
      },
    }
  }

  const access = await getPostAccess({
    viewerUserId: viewerUserId ?? null,
    post: {
      id: post.id,
      creatorId: post.creator_id,
      content: post.content ?? undefined,
      visibility: post.visibility,
      price: post.price,
      createdAt: post.created_at,
    },
    creator: {
      userId: creator.user_id,
    },
    isSubscribedResult: isSubscribed,
    hasPurchasedResult: hasPurchased,
  })

  const projectionRuntime = await assemblePostProjectionRuntime({
    sourceFile: "src/modules/creator/runtime/get-creator-page.ts",
    sourceSymbol: "getCreatorPage",
    surface: "creator_page_projection",
    post: {
      id: post.id,
      creatorId: post.creator_id,
      content: post.content,
      visibility: post.visibility,
    },
    access,
    publicState: "published",
    viewerUserId: viewerUserId ?? null,
    creatorUserId: creator.user_id,
    isSubscribed,
    hasPurchased,
    blocks: mappedBlocks,
    mediaRows,
    correlationKeys: {
      postId: post.id,
      creatorId: creator.id,
      creatorUserId: creator.user_id,
      viewerUserId: viewerUserId ?? null,
    },
  })

  const likeState = {
    likesCount: readPostLikeCount(likeCountMap, post.id),
    viewerHasLiked: myLikeSet.has(post.id),
  }

  return {
    id: post.id,
    text: access.canView ? projectionRuntime.renderInput.blockText || "" : "",
    canView: access.canView,
    isLocked: access.isLocked,
    lockReason: access.lockReason,
    price: post.price,
    media: projectionRuntime.selectedMedia,
    blocks: access.canView ? projectionRuntime.selectedBlocks : [],
    renderInput: projectionRuntime.renderInput,
    createdAt: post.published_at ?? post.created_at,
    publishedAt: post.published_at,
    status: post.status,
    visibility: post.visibility,
    ...likeState,
    ...createPostLikeCompatibilityFields(likeState),
    commentsCount: commentCountMap.get(post.id) ?? 0,
    creatorId: creator.id,
    creatorUserId: creator.user_id,
    currentUserId: viewerUserId ?? null,
    creator: {
      username: identity.username,
      displayName: identity.displayName,
      avatarUrl: identity.avatarUrl,
    },
  }
}
