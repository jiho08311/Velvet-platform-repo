import {
  findFeedPostBlocksByPostIds,
  findFeedPostMediaRowsByPostIds,
  findSubscribedFeedCreatorsByIds,
  findSubscribedFeedPostsByCreatorIds,
  findSubscribedFeedSubscriptionsByUserId,
} from "@/modules/post/repositories/post-feed-repository"
import { buildSubscriptionReadModel } from "@/modules/subscription/server/build-subscription-read-model"
import {
  filterFeedPostCandidates,
  isVisibleFeedCreator,
} from "@/modules/feed/server/feed-inclusion-policy"
import type {
  PostRenderListItem,
} from "../types"
import { getPostAccess } from "./get-post-access"
import {
  normalizeLikeCount,
} from "@/shared/lib/like-interaction-result"
import { findPostLikeRowsByPostIds } from "@/modules/post/repositories/post-like-repository"
import {
  groupFeedBlockRowsByPostId,
  groupFeedMediaRowsByPostId,
} from "@/modules/post/mappers/post-feed-mapper"
import { buildSubscribedFeedListItem } from "@/modules/post/services/post-feed-render-service"

type ListFeedPostsInput = {
  userId: string
  limit?: number
}

export async function listFeedPosts({
  userId,
  limit = 20,
}: ListFeedPostsInput): Promise<PostRenderListItem[]> {
  const resolvedUserId = userId.trim()
  const safeLimit = Math.max(1, Math.min(limit, 100))
  const now = new Date().toISOString()

  if (!resolvedUserId) {
    return []
  }

  const subscriptions =
    await findSubscribedFeedSubscriptionsByUserId(resolvedUserId)

  const creatorIds = (subscriptions ?? [])
    .filter((subscription) =>
      buildSubscriptionReadModel(subscription).hasAccess
    )
    .map((subscription) => subscription.creator_id)

  if (creatorIds.length === 0) {
    return []
  }

  const creatorRows = await findSubscribedFeedCreatorsByIds(creatorIds)

  const visibleCreatorMap = new Map(
    (creatorRows ?? [])
      .filter((creator) => isVisibleFeedCreator(creator))
      .map((creator) => [creator.id, creator])
  )

  const visibleCreatorIds = Array.from(visibleCreatorMap.keys())

  if (visibleCreatorIds.length === 0) {
    return []
  }

  const posts = await findSubscribedFeedPostsByCreatorIds({
    creatorIds: visibleCreatorIds,
    limit: safeLimit * 3,
  })

  const resolvedPosts = filterFeedPostCandidates(posts ?? [], now, [
    "published",
  ])
    .map(({ post }) => post)
    .slice(0, safeLimit)

  const postIds = resolvedPosts.map((post) => post.id)

  if (postIds.length === 0) {
    return []
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
      .filter((row) => row.user_id === resolvedUserId)
      .map((row) => row.post_id)
  )

  const mediaRows = await findFeedPostMediaRowsByPostIds({
    postIds,
    statuses: ["ready"],
  })

  const blockRows = await findFeedPostBlocksByPostIds(postIds)

  const mediaMap = groupFeedMediaRowsByPostId(mediaRows ?? [])
  const blocksMap = groupFeedBlockRowsByPostId(blockRows ?? [])

  return Promise.all(
    resolvedPosts.map(async (post) => {
      const creator = visibleCreatorMap.get(post.creator_id)
      const creatorUserId = creator?.user_id ?? ""

      const access = await getPostAccess({
        viewerUserId: resolvedUserId,
        post: {
          id: post.id,
          creatorId: post.creator_id,
          content: post.content ?? undefined,
          visibility: post.visibility,
          price: post.price,
          createdAt: post.created_at,
        },
        creator: {
          userId: creatorUserId,
        },
        isSubscribedResult: true,
        hasPurchasedResult: false,
      })

      return buildSubscribedFeedListItem({
        post,
        access,
        mediaRows: mediaMap.get(post.id) ?? [],
        blockRows: blocksMap.get(post.id) ?? [],
        viewerUserId: resolvedUserId,
        creatorUserId,
        likeState: {
          likesCount: normalizeLikeCount(likeCountMap.get(post.id)),
          viewerHasLiked: likedPostIdSet.has(post.id),
        },
      })
    })
  )
}