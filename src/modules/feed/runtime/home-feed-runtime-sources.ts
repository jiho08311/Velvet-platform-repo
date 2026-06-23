import {
  loadCanonicalHomeFeedPosts,
  loadHomeFeedCreatorMap,
  loadHomeFeedEntitlementProjection,
} from "./home-feed-catalog-source"
import { loadHomeFeedEngagement } from "./home-feed-engagement-source"
import { loadPublishedHomeFeedMediaMap } from "./home-feed-media-source"
import { findFeedPostBlocksByPostIds } from "@/modules/post/repositories/post-feed-repository"
import type {
  FeedPostBlockRow,
} from "@/modules/post/repositories/post-feed-repository"
import type { HomeFeedPostRow } from "./home-feed-runtime-types"

function groupHomeFeedBlocksByPostId(
  rows: FeedPostBlockRow[]
): Map<string, FeedPostBlockRow[]> {
  const map = new Map<string, FeedPostBlockRow[]>()

  for (const row of rows) {
    const current = map.get(row.post_id) ?? []
    current.push(row)
    map.set(row.post_id, current)
  }

  for (const [postId, blocks] of map.entries()) {
    map.set(
      postId,
      [...blocks].sort((a, b) => a.sort_order - b.sort_order)
    )
  }

  return map
}




export async function loadHomeFeedSourceData(input: {
  cursor?: string | null
  fetchLimit: number
  filteredPosts: Array<{
    post: HomeFeedPostRow
    publicState: string
  }>
  viewerUserId: string
}) {
  const postIds = input.filteredPosts.map(({ post }) => post.id)

const [
  entitlementProjectionByPostId,
  engagement,
  mediaMap,
  blockRows,
] = await Promise.all([
    loadHomeFeedEntitlementProjection({
      postIds,
      viewerUserId: input.viewerUserId,
    }),
    loadHomeFeedEngagement({
      postIds,
      viewerUserId: input.viewerUserId,
    }),
    loadPublishedHomeFeedMediaMap(input.filteredPosts),
    findFeedPostBlocksByPostIds(postIds),
  ])

  return {
    blockMap: groupHomeFeedBlocksByPostId(blockRows),
    entitlementProjectionByPostId,
    ...engagement,
    mediaMap,
  }
}

export {
  loadCanonicalHomeFeedPosts,
  loadHomeFeedCreatorMap,
}