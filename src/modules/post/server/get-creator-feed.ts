import {
  findCreatorFeedCreatorById,
  findCreatorFeedPostsByCreatorId,
  findFeedPostBlocksByPostIds,
  findFeedPostMediaRowsByPostIds,
} from "@/modules/post/repositories/post-feed-repository"
import {
  buildPostLikeCountMap,
  readPostLikeCount,
} from "@/shared/lib/post-like-count"
import { createPostLikeCompatibilityFields } from "@/shared/lib/like-interaction-result"
import {
  findPostLikeRowsByPostIds,
  findUserPostLikeRowsByPostIds,
} from "@/modules/post/repositories/post-like-repository"
import {
  filterFeedPostCandidates,
  isVisibleFeedCreator,
} from "@/modules/feed/server/feed-inclusion-policy"
import type { PostRenderSurfaceItem } from "../types"
import { buildPostRenderInput } from "@/modules/post/lib/post-render-input"
import { resolvePostAccessState } from "./resolve-post-access-state"
import { countCommentsByPostIds } from "@/modules/post/repositories/comment-repository"
import {
  groupFeedBlockRowsByPostId,
  groupFeedMediaRowsByPostId,
} from "@/modules/post/mappers/post-feed-mapper"
import { buildCreatorFeedSurfaceItem } from "@/modules/post/services/post-feed-render-service"

export type GetCreatorFeedInput = {
  creatorId: string
  creatorUserId?: string | null
  userId?: string | null
}

export async function getCreatorFeed({
  creatorId,
  creatorUserId,
  userId,
}: GetCreatorFeedInput): Promise<PostRenderSurfaceItem[]> {
  const safeUserId =
    typeof userId === "string" && userId.trim().length > 0
      ? userId.trim()
      : null

  const safeCreatorUserId =
    typeof creatorUserId === "string" && creatorUserId.trim().length > 0
      ? creatorUserId.trim()
      : null

  const now = new Date().toISOString()

  const creator = await findCreatorFeedCreatorById(creatorId)

  if (!creator) {
    return []
  }

  const resolvedCreatorUserId = safeCreatorUserId ?? creator.user_id
  const isOwner =
    safeUserId !== null && safeUserId === resolvedCreatorUserId

  if (!isOwner && !isVisibleFeedCreator(creator)) {
    return []
  }

  const posts = await findCreatorFeedPostsByCreatorId(creatorId)

  const visiblePosts = filterFeedPostCandidates(posts ?? [], now, [
    "published",
    "upcoming",
  ])

  const resolvedPosts = await Promise.all(
    visiblePosts.map(async ({ post, publicState }) => {
      const resolvedAccessState = await resolvePostAccessState({
        viewerUserId: safeUserId,
        creatorId,
        creatorUserId: resolvedCreatorUserId,
        post: {
          id: post.id,
          title: null,
          content: post.content,
          status: post.status as PostRenderSurfaceItem["status"],
          visibility: post.visibility,
          price: post.price,
          publishedAt: post.published_at ?? null,
          createdAt: post.created_at,
          updatedAt: post.created_at,
        },
      })

      return {
        ...post,
        publicState,
        price: post.price,
        hasPurchased: resolvedAccessState.hasPurchased,
        isSubscribed: resolvedAccessState.isSubscribed,
        canView: resolvedAccessState.canView,
        isLocked: resolvedAccessState.isLocked,
        lockReason: resolvedAccessState.lockReason,
        commerce: resolvedAccessState.commerce,
        access: resolvedAccessState.access,
      }
    })
  )

  const postIds = resolvedPosts.map((post) => post.id)

  const [likeRows, myLikeRows] = await Promise.all([
    findPostLikeRowsByPostIds(postIds),
    safeUserId
      ? findUserPostLikeRowsByPostIds({
          postIds,
          userId: safeUserId,
        })
      : Promise.resolve([]),
  ])

  const likeCountMap = buildPostLikeCountMap(likeRows)

  const myLikeSet = new Set((myLikeRows ?? []).map((row) => row.post_id))

  const commentCountMap = await countCommentsByPostIds(postIds)

  if (postIds.length === 0) {
    return resolvedPosts.map((post) => {
      const likeState = {
        likesCount: 0,
        viewerHasLiked: false,
      }

      return {
        id: post.id,
        creatorId: post.creator_id,
        content: null,
        createdAt: post.created_at,
        renderInput: buildPostRenderInput({
          text: "",
          blocks: [],
          media: [],
        }),
        media: [],
        blocks: [],
        price: post.price,
        isLocked: post.isLocked,
        lockReason: post.lockReason,
        commerce: post.commerce,
        canView: post.canView,
        ...likeState,
        ...createPostLikeCompatibilityFields(likeState),
        visibility: post.visibility,
        commentsCount: 0,
        status: post.status as PostRenderSurfaceItem["status"],
        publishedAt: post.published_at ?? null,
      }
    })
  }

  const blockRows = await findFeedPostBlocksByPostIds(postIds)

  const mediaRows = await findFeedPostMediaRowsByPostIds({
    postIds,
    statuses: ["processing", "ready"],
  })

  const mediaMap = groupFeedMediaRowsByPostId(mediaRows ?? [])
  const blocksMap = groupFeedBlockRowsByPostId(blockRows ?? [])

  return Promise.all(
    resolvedPosts.map((post) =>
      buildCreatorFeedSurfaceItem({
        post,
        mediaRows: mediaMap.get(post.id) ?? [],
        blockRows: blocksMap.get(post.id) ?? [],
        viewerUserId: safeUserId,
        creatorUserId: resolvedCreatorUserId,
        likeState: {
          likesCount: readPostLikeCount(likeCountMap, post.id),
          viewerHasLiked: myLikeSet.has(post.id),
        },
        commentsCount: commentCountMap.get(post.id) ?? 0,
      })
    )
  )
}