import { createMediaSignedUrl } from "@/modules/media/public/create-media-signed-url"
import { buildPostRenderInput } from "@/modules/post/lib/post-render-input"
import {
  findPostBlocksByPostIds,
  type CreatorStudioPostBlockRow,
} from "@/modules/post/repositories/post-block-repository"
import { findPostLikeRowsByPostIds } from "@/modules/post/repositories/post-like-repository"
import {
  findMyPostMediaRowsByPostIds,
  type MyPostsMediaRow,
} from "@/modules/post/repositories/post-media-repository"
import {
  findCreatorForMyPosts,
  findMyPostRowsByCreatorId,
  type MyPostsPostRow,
} from "@/modules/post/repositories/post-repository"
import type { PostCommerceState, PostRenderListItem } from "../types"
import { buildPostRenderReadModel } from "./post-render-read-model"
import { getBlockedPostCommerceState } from "@/modules/post/lib/post-commerce-policy"
import {
  createPostLikeCompatibilityFields,
  normalizeLikeCount,
} from "@/shared/lib/like-interaction-result"

export type MyPostListItem = PostRenderListItem & {
  commerce: PostCommerceState
}

export type GetMyPostsInput = {
  creatorId: string
  limit?: number
  cursor?: string | null
  status?: "draft" | "scheduled" | "published"
}

export type GetMyPostsResult = {
  items: MyPostListItem[]
  nextCursor: string | null
}

function resolveMediaType(
  row: MyPostsMediaRow
): "image" | "video" | "audio" | "file" {
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

function getOwnedPostCommerceState(
  visibility: MyPostsPostRow["visibility"]
): PostCommerceState {
  const isPaidPost = visibility === "paid"

  return getBlockedPostCommerceState({
    blockingReason: isPaidPost ? "owner" : "not_paid_post",
    hasPurchased: isPaidPost,
    isSubscribed: true,
  })
}

export async function getMyPosts(
  input: GetMyPostsInput
): Promise<GetMyPostsResult> {
  const rawCreatorId = input.creatorId.trim()

  if (!rawCreatorId) {
    throw new Error("Creator id is required")
  }

  const limit = Math.max(1, Math.min(input.limit ?? 20, 100))

  const creator = await findCreatorForMyPosts(rawCreatorId)

  if (!creator) {
    return {
      items: [],
      nextCursor: null,
    }
  }

  const posts = await findMyPostRowsByCreatorId({
    creatorId: creator.id,
    status: input.status,
    limit,
  })

  const postIds = posts.map((post) => post.id)

  if (postIds.length === 0) {
    return {
      items: [],
      nextCursor: null,
    }
  }

  const likeRows = await findPostLikeRowsByPostIds(postIds)

  const likeCountMap = new Map<string, number>()

  for (const row of likeRows ?? []) {
    likeCountMap.set(
      row.post_id,
      normalizeLikeCount(likeCountMap.get(row.post_id)) + 1
    )
  }

  const likedPostIdSet = new Set(
    (likeRows ?? [])
      .filter((row) => row.user_id === creator.user_id)
      .map((row) => row.post_id)
  )

  const mediaRows = await findMyPostMediaRowsByPostIds(postIds)
  const blockRows = await findPostBlocksByPostIds(postIds)

  const mediaMap = new Map<string, MyPostsMediaRow[]>()

  for (const media of mediaRows ?? []) {
    const current = mediaMap.get(media.post_id) ?? []
    current.push(media)
    mediaMap.set(media.post_id, current)
  }

  const blocksMap = new Map<string, CreatorStudioPostBlockRow[]>()

  for (const block of blockRows ?? []) {
    const current = blocksMap.get(block.post_id) ?? []
    current.push(block)
    blocksMap.set(block.post_id, current)
  }

  const items = await Promise.all(
    posts.map(async (post) => {
      const mediaRowsForPost = mediaMap.get(post.id) ?? []

      const media = await Promise.all(
        mediaRowsForPost.map(async (item) => {
          const url = await createMediaSignedUrl({
            storagePath: item.storage_path,
            viewerUserId: creator.user_id,
            creatorUserId: creator.user_id,
            visibility: post.visibility,
            canView: true,
            isSubscribed: true,
            hasPurchased: true,
          })

          return {
            id: item.id,
            url,
            type: resolveMediaType(item),
            mimeType: item.mime_type,
            sortOrder: item.sort_order,
          }
        })
      )

      const renderReadModel = buildPostRenderReadModel({
        blockRows: blocksMap.get(post.id) ?? [],
        mediaItems: media,
      })

      const renderInput = buildPostRenderInput({
        text: post.content ?? "",
        blocks: renderReadModel.blocks,
        media: renderReadModel.media,
      })

      const likeState = {
        likesCount: normalizeLikeCount(likeCountMap.get(post.id)),
        viewerHasLiked: likedPostIdSet.has(post.id),
      }

      return {
        id: post.id,
        creatorId: post.creator_id,
        content: renderInput.blockText || null,
        renderInput,
        status: post.status,
        visibility: post.visibility,
        price: 0,
        canView: true,
        isLocked: false,
        lockReason: "none" as const,
        commerce: getOwnedPostCommerceState(post.visibility),
        ...likeState,
        ...createPostLikeCompatibilityFields(likeState),
        createdAt: post.created_at,
        publishedAt: post.published_at,
        media: media.map((item) => ({
          url: item.url,
          type: item.type,
        })),
      }
    })
  )

  return {
    items,
    nextCursor: null,
  }
}