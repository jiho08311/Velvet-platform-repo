import { isCreatorOwner } from "@/modules/creator/public/creator-identity"
import type {
  PostBlock,
  PostCommerceState,
  PostRenderInput,
} from "@/modules/post/types"
import { mapPostBlocksToRenderableBlocks } from "@/modules/post/mappers/post-render-mapper"
import { getPostBlocks } from "@/modules/post/runtime/get-post-blocks"
import { resolvePostAccessEntitlement as resolvePostAccessState } from "@/modules/post/runtime/resolve-post-access-entitlement"
import {
  getPublicDiscoveryPostState,
  isEligiblePublicDiscoveryCreator,
} from "@/modules/post/policies/public-discovery-inclusion"
import { normalizeLikeCount } from "@/shared/lib/like-interaction-result"
import {
  countPostLikes,
  hasUserLikedPost,
} from "@/modules/post/repositories/post-like-repository"
import { countCommentsByPostId } from "@/modules/post/repositories/comment-repository"
import { findPostMediaRowsByPostId } from "@/modules/media/public/get-post-media-bindings"
import { findPostCreatorById } from "@/modules/post/repositories/post-repository"
import { mapPostDetail } from "@/modules/post/mappers/post-mapper"
import { assemblePostProjectionRuntime } from "@/modules/post/runtime/post-projection-runtime"
import { shadowReadPostAuthorityRuntime } from "@/modules/post/runtime/shadow-read-post-authority-runtime"
import { readPostAuthority } from "@/modules/post/repositories/post-read-authority-repository"

function toPostBlocks(
  rows: Awaited<ReturnType<typeof getPostBlocks>>
): PostBlock[] {
  const result: PostBlock[] = []

  for (const row of rows) {
    if (
      row.type !== "text" &&
      row.type !== "image" &&
      row.type !== "video" &&
      row.type !== "audio" &&
      row.type !== "file"
    ) {
      continue
    }

    result.push({
      id: row.id,
      postId: row.post_id,
      type: row.type,
      content: row.content,
      mediaId: row.media_id,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      editorState: row.editor_state as PostBlock["editorState"],
    })
  }

  return result
}

export type PostDetail = {
  id: string
  creatorId: string
  creatorUserId: string
  creator: {
    username: string
    displayName: string | null
  }
  title: string | null
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price: number | null
  status: "draft" | "scheduled" | "published" | "archived"
  createdAt: string
  publishedAt: string | null
  canView: boolean
  isLocked: boolean
  lockReason: "none" | "subscription" | "purchase"
  commerce: PostCommerceState
  likesCount: number
  viewerHasLiked: boolean
  isLiked: boolean
  commentsCount: number
  media: {
    id: string
    postId: string
    type: "image" | "video" | "audio" | "file"
    url: string
    mimeType: string | null
    sortOrder: number
  }[]
  blocks?: PostBlock[]
  renderInput: PostRenderInput
}

export async function getPostByIdRuntime(
  postId: string,
  viewerUserId?: string | null
): Promise<PostDetail | null> {
  const resolvedPostId = postId.trim()
  const resolvedViewerUserId =
    typeof viewerUserId === "string" && viewerUserId.trim().length > 0
      ? viewerUserId.trim()
      : null

  if (!resolvedPostId) {
    throw new Error("postId is required")
  }

const post = await readPostAuthority(resolvedPostId)

  if (!post) {
    return null
  }

  void shadowReadPostAuthorityRuntime({
    postId: resolvedPostId,
    sourceSurface: "post.getPostByIdRuntime",
  })

  const creator = await findPostCreatorById(post.creator_id)

  if (!creator) {
    throw new Error("Creator not found")
  }

  const isOwner = isCreatorOwner({
    viewerUserId: resolvedViewerUserId,
    creatorUserId: creator.user_id,
  })

  const now = new Date().toISOString()
  const publicState = getPublicDiscoveryPostState(post, now)

  const isVisibleCreator = isEligiblePublicDiscoveryCreator({
    creator: {
      status: creator.status,
    },
    profile: creator.profiles,
  })

  if (!isOwner) {
    if (!isVisibleCreator) {
      return null
    }

    if (publicState !== "published") {
      return null
    }
  }

  const [likesCount, commentsCount] = await Promise.all([
    countPostLikes(post.id),
    countCommentsByPostId(post.id),
  ])

  const resolvedLikesCount = normalizeLikeCount(likesCount)

  const viewerHasLiked = resolvedViewerUserId
    ? await hasUserLikedPost({
        postId: post.id,
        userId: resolvedViewerUserId,
      })
    : false

  const accessState = await resolvePostAccessState({
    viewerUserId: resolvedViewerUserId,
    creatorId: post.creator_id,
    creatorUserId: creator.user_id,
    post: {
      id: post.id,
      title: post.title,
      content: post.content,
      status: post.status,
      visibility: post.visibility,
      price: post.price ?? 0,
      publishedAt: post.published_at,
      createdAt: post.created_at,
      updatedAt: post.created_at,
    },
  })

  const [allBlockRows, allMediaRows] = await Promise.all([
    getPostBlocks(post.id),
    findPostMediaRowsByPostId(post.id),
  ])

  const projectionRuntime = await assemblePostProjectionRuntime({
    sourceFile: "src/modules/post/runtime/get-post-by-id.ts",
    sourceSymbol: "getPostById",
    surface: "post_detail_projection",
    post: {
      id: post.id,
      creatorId: post.creator_id,
      content: post.content,
      visibility: post.visibility,
    },
    access: accessState.access,
    publicState,
    viewerUserId: resolvedViewerUserId,
    creatorUserId: creator.user_id,
    isSubscribed: accessState.isSubscribed,
    hasPurchased: accessState.hasPurchased,
    blocks: mapPostBlocksToRenderableBlocks(toPostBlocks(allBlockRows)),
    mediaRows: allMediaRows,
    correlationKeys: {
      postId: post.id,
      creatorId: creator.id,
      viewerUserId: resolvedViewerUserId,
    },
  })

  const legacyResponse = mapPostDetail({
    post,
    creator,
    canView: accessState.access.canView,
    isLocked: accessState.access.isLocked,
    lockReason: accessState.access.lockReason,
    commerce: accessState.commerce,
    likesCount: resolvedLikesCount,
    viewerHasLiked,
    commentsCount,
    selectedMedia: projectionRuntime.selectedMedia.map((media) => ({
      id: media.id,
      postId: post.id,
      type: media.type,
      url: media.url,
      mimeType: media.mimeType,
      sortOrder: media.sortOrder ?? 0,
    })),
    selectedBlocks: projectionRuntime.selectedBlocks,
    renderInput: projectionRuntime.renderInput,
  })

  return legacyResponse
}