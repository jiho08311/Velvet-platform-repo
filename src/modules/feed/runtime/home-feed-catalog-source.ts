import { listAccessAwarePostProjectionSnapshots } from "@/modules/entitlement/public/access-aware-post-projection-read-model"
import { listCanonicalFeedItems } from "@/modules/post/public/canonical-feed-item-read-model"
import { findPublicCreatorCardsByCreatorIds } from "@/modules/search/public/creator-public-card-read-model"
import {
  mapCreatorCardsById,
} from "./home-feed-runtime-mappers"
import type { HomeFeedPostRow } from "./home-feed-runtime-types"
import { findFeedPostBlocksByPostIds } from "@/modules/post/repositories/post-feed-repository"
import type { FeedPostBlockRow } from "@/modules/post/repositories/post-feed-repository"
export function mapCanonicalFeedRowsToPublicPosts(
  rows: Awaited<ReturnType<typeof listCanonicalFeedItems>>["data"],
  cursor: string | null | undefined
): HomeFeedPostRow[] {
  return (rows ?? [])
    .filter((row) => row.visibility === "public")
    .filter((row) => row.deleted_at == null)
    .filter((row) => (cursor ? String(row.published_at ?? "") < cursor : true))
    .map((row) => ({
      id: row.post_id,
      creator_id: row.creator_id,
      title: row.title,
      content: row.content,
      visibility: row.visibility as HomeFeedPostRow["visibility"],
      price: row.price,
      status: row.status as HomeFeedPostRow["status"],
      created_at: row.created_at,
      published_at: row.published_at,
      visibility_status:
        row.visibility_status as HomeFeedPostRow["visibility_status"],
      moderation_status:
        row.moderation_status as HomeFeedPostRow["moderation_status"],
      deleted_at: row.deleted_at,
      post_blocks: [],
    }))
}

export async function loadCanonicalHomeFeedPosts(input: {
  cursor?: string | null
  fetchLimit: number
}) {
  const { data: canonicalFeedRows, error: canonicalFeedError } =
    await listCanonicalFeedItems({
      projectionSurface: "home_feed",
      limit: input.fetchLimit,
    })

  if (canonicalFeedError) {
    throw canonicalFeedError
  }

  return mapCanonicalFeedRowsToPublicPosts(canonicalFeedRows, input.cursor)
}

export async function loadHomeFeedCreatorMap(posts: HomeFeedPostRow[]) {
  const creatorIds = Array.from(new Set(posts.map((post) => post.creator_id)))
  const creatorRows = await findPublicCreatorCardsByCreatorIds(creatorIds)
  return mapCreatorCardsById(creatorRows)
}

export function loadHomeFeedEntitlementProjection(input: {
  postIds: string[]
  viewerUserId: string
}) {
  return listAccessAwarePostProjectionSnapshots({
    viewerUserId: input.viewerUserId || null,
    postIds: input.postIds,
  })
}
