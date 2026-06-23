import { listCanonicalFeedItems } from "@/modules/post/public/canonical-feed-item-read-model"
import { findPublicCreatorCardsByCreatorIds } from "@/modules/search/public/creator-public-card-read-model"
import { filterPublicDiscoveryPostCandidates } from "@/modules/post/public/public-discovery-inclusion"

export type PublicUpcomingPostItem = {
  id: string
  creatorId: string
  creatorUserId: string
  title: string
  previewText: string | null
  scheduledAt: string
  creator: {
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
}

type PostRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  status: "draft" | "scheduled" | "published" | "archived"
  visibility: "public" | "subscribers" | "paid"
  visibility_status: "draft" | "published" | "processing" | "rejected" | null
  moderation_status: "pending" | "approved" | "rejected" | "needs_review" | null
  published_at: string | null
  deleted_at: string | null
}

export async function listPublicUpcomingPosts(
  limit = 3,
): Promise<PublicUpcomingPostItem[]> {
  const now = new Date().toISOString()

  const { data: canonicalFeedRows, error: postsError } =
    await listCanonicalFeedItems({
      projectionSurface: "public_upcoming_posts",
      limit,
    })

  if (postsError) {
    throw postsError
  }

  const posts: PostRow[] = (canonicalFeedRows ?? [])
    .filter((row) => row.status === "scheduled")
    .filter((row) => row.visibility === "public")
    .filter((row) => row.deleted_at == null)
    .filter((row) => row.published_at != null && row.published_at > now)
    .map((row) => ({
      id: row.post_id,
      creator_id: row.creator_id,
      title: row.title,
      content: row.content,
      status: row.status as PostRow["status"],
      visibility: row.visibility as PostRow["visibility"],
      visibility_status: row.visibility_status as PostRow["visibility_status"],
      moderation_status: row.moderation_status as PostRow["moderation_status"],
      published_at: row.published_at,
      deleted_at: row.deleted_at,
    }))

  const resolvedPosts = filterPublicDiscoveryPostCandidates(posts, now, [
    "upcoming",
  ]).map(({ post }) => post)

  if (resolvedPosts.length === 0) {
    return []
  }

  const creatorIds = Array.from(
    new Set(resolvedPosts.map((post) => post.creator_id)),
  )

  const creatorCards = await findPublicCreatorCardsByCreatorIds(creatorIds)

  const creatorMap = new Map(
    creatorCards.map((creator) => [creator.creator_id, creator]),
  )

  return resolvedPosts
    .filter((post) => creatorMap.has(post.creator_id))
    .map((post) => {
      const creator = creatorMap.get(post.creator_id)!

      return {
        id: post.id,
        creatorId: post.creator_id,
        creatorUserId: creator.user_id,
        title: post.title?.trim() || "Upcoming post",
        previewText: post.content?.trim() || null,
        scheduledAt: post.published_at ?? "",
        creator: {
          username: creator.username ?? "",
          displayName: creator.display_name,
          avatarUrl: creator.avatar_url,
        },
      }
    })
}
