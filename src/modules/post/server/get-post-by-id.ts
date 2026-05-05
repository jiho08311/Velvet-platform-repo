
import { isCreatorOwner } from "@/modules/creator/lib/creator-identity"
import type {
  PostBlock,
  PostCommerceState,
  PostRenderInput,
} from "../types"
import {
  mapPostBlocksToRenderableBlocks,
  selectPostRenderableBlocks,
} from "@/modules/post/mappers/post-render-mapper"
import { getPostBlocks } from "@/modules/post/server/get-post-blocks"
import { buildPostRenderInput } from "@/modules/post/lib/post-render-input"
import { createMediaSignedUrl } from "@/modules/media/public/create-media-signed-url"
import { buildLockedPreviewPolicy } from "./locked-preview-policy"
import { resolvePostAccessState } from "./resolve-post-access-state"
import {
  getPublicDiscoveryPostState,
  isEligiblePublicDiscoveryCreator,
} from "@/modules/post/lib/public-discovery-inclusion"
import { normalizeLikeCount } from "@/shared/lib/like-interaction-result"
import {
  countPostLikes,
  hasUserLikedPost,
} from "@/modules/post/repositories/post-like-repository"
import { countCommentsByPostId } from "@/modules/post/repositories/comment-repository"
import { findPostMediaRowsByPostId } from "@/modules/post/repositories/post-media-repository"
import {
  findPostById,
  findPostCreatorById,
} from "@/modules/post/repositories/post-repository"
import { mapPostDetail } from "@/modules/post/mappers/post-mapper"


type PostRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price: number | null
  status: "draft" | "scheduled" | "published" | "archived"
  visibility_status: "draft" | "published" | "processing" | "rejected" | null
  moderation_status: "pending" | "approved" | "rejected" | "needs_review" | null
  created_at: string
  published_at: string | null
  deleted_at?: string | null
}

type CreatorRow = {
  id: string
  user_id: string
  username: string
  display_name: string | null
  status: "active" | "pending" | "suspended" | "inactive"
  profiles: {
    id: string
    is_deactivated: boolean | null
    is_delete_pending: boolean | null
    deleted_at: string | null
    is_banned: boolean | null
  } | null
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


import {
  mapPostDetailMediaToRenderMedia,
  mapPostMediaRowsToPreviewMedia,
  mapSignedPostMediaItem,
  selectPostMediaRowsForAccess,
  sortPostMediaRows,
} from "@/modules/post/mappers/post-media-mapper"


export async function getPostById(
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

 const post = await findPostById(resolvedPostId)

if (!post) {
  return null
}



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



  const {
    isSubscribed,
    hasPurchased,
    access,
    commerce,
  } = await resolvePostAccessState({
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

const sortedBlocks = mapPostBlocksToRenderableBlocks(allBlockRows)

const sortedMediaRows = sortPostMediaRows(allMediaRows)

  const previewPolicy = buildLockedPreviewPolicy({
    access,
    publicState,
    text: post.content ?? "",
    blocks: sortedBlocks,
media: mapPostMediaRowsToPreviewMedia(sortedMediaRows),
  })

const selectedMediaRows = selectPostMediaRowsForAccess({
  canView: access.canView,
  sortedMediaRows,
  previewMedia: previewPolicy.previewMedia,
})

   const selectedMedia = await Promise.all(
    selectedMediaRows.map(async (item) => {
      const url = await createMediaSignedUrl({
        storagePath: item.storage_path,
        viewerUserId: resolvedViewerUserId,
        creatorUserId: creator.user_id,
        visibility: post.visibility,
        canView: access.canView,
        isSubscribed,
        hasPurchased,
        allowPreview: !access.canView && previewPolicy.allowPreviewMediaSigning,
      })

      return mapSignedPostMediaItem({
        row: item,
        url,
      })
    })
  )

const selectedBlocks = selectPostRenderableBlocks({
  canView: access.canView,
  sortedBlocks,
  previewBlocks: previewPolicy.previewBlocks,
})

  const renderInput = buildPostRenderInput({
    text: access.canView ? (post.content ?? "") : previewPolicy.renderTextSeed,
    blocks: selectedBlocks,
media: mapPostDetailMediaToRenderMedia(selectedMedia),
  })

return mapPostDetail({
  post,
  creator,
  canView: access.canView,
  isLocked: access.isLocked,
  lockReason: access.lockReason,
  commerce,
  likesCount: resolvedLikesCount,
  viewerHasLiked,
  commentsCount,
  selectedMedia,
  selectedBlocks,
  renderInput,
})
}