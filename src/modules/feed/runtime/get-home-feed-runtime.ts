import { filterFeedPostCandidates } from "@/modules/feed/policies/feed-inclusion-policy"
import { resolveContentServingAuthorityRuntime } from "@/modules/post/public/content-serving-authority-runtime"
import { buildHomeFeedItem } from "./home-feed-runtime-item"
import {
  loadCanonicalHomeFeedPosts,
  loadHomeFeedCreatorMap,
  loadHomeFeedSourceData,
} from "./home-feed-runtime-sources"
import type {
  GetHomeFeedInput,
  GetHomeFeedResult,
  HomeFeedItem,
} from "./home-feed-runtime-types"

export type { GetHomeFeedInput, GetHomeFeedResult, HomeFeedItem }

export async function getHomeFeedRuntime(
  input: GetHomeFeedInput
): Promise<GetHomeFeedResult> {
  const viewerUserId = input.viewerUserId?.trim() ?? ""
  const safeLimit = Math.max(1, Math.min(input.limit ?? 20, 100))
  const fetchLimit = Math.max(safeLimit * 3, 60)
  const now = new Date().toISOString()

  const servingAuthority = await resolveContentServingAuthorityRuntime({
    runtimeSurface: "feed.getHomeFeedRuntime",
    authoritySurface: "home_feed_projection",
  })

  void servingAuthority

  const publicPosts = await loadCanonicalHomeFeedPosts({
    cursor: input.cursor,
    fetchLimit,
  })

  const visiblePostCandidates = filterFeedPostCandidates(publicPosts, now, [
    "published",
    "upcoming",
  ])

  if (visiblePostCandidates.length === 0) {
    return {
      items: [],
      nextCursor: null,
    }
  }

  const creatorMap = await loadHomeFeedCreatorMap(
    visiblePostCandidates.map(({ post }) => post)
  )

  if (creatorMap.size === 0) {
    return {
      items: [],
      nextCursor: null,
    }
  }

  const filteredPosts = visiblePostCandidates
    .filter(({ post }) => creatorMap.has(post.creator_id))
    .slice(0, safeLimit)

  if (filteredPosts.length === 0) {
    return {
      items: [],
      nextCursor: null,
    }
  }

  const {
    blockMap,
    commentCountMap,
    entitlementProjectionByPostId,
    likeCountMap,
    mediaMap,
    myLikeSet,
  } = await loadHomeFeedSourceData({
    cursor: input.cursor,
    fetchLimit,
    filteredPosts,
    viewerUserId,
  })

  const items: HomeFeedItem[] = await Promise.all(
    filteredPosts.map(({ post, publicState }) =>
      buildHomeFeedItem({
        post: {
          ...post,
          post_blocks: blockMap.get(post.id) ?? [],
        },
        publicState: publicState as "published" | "upcoming",
        creator: creatorMap.get(post.creator_id),
        viewerUserId,
        cursor: input.cursor,
        entitlementProjectionObserved: entitlementProjectionByPostId.has(
          post.id
        ),
        likeCountMap,
        myLikeSet,
        commentCountMap,
        mediaRows: mediaMap.get(post.id) ?? [],
      })
    )
  )

  return {
    items,
    nextCursor:
      items.length === safeLimit
        ? items[items.length - 1]?.publishedAt ?? null
        : null,
  }
}