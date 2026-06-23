import {
  findCreatorFeedPostsByCreatorId,
} from "@/modules/post/repositories/post-feed-repository"

export const PUBLIC_CONTRACT = true

export type CreatorPublicPostReadModel = {
  id: string
  creatorId: string
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price: number
  status: string
  createdAt: string
  publishedAt: string | null
  visibilityStatus: string | null
  moderationStatus: string | null
  deletedAt: string | null
  feedVisibilityState: string | null
  isFeedVisible: boolean | null
}

export type ListCreatorPublicPostsInput = {
  creatorId: string
}

export async function listCreatorPublicPosts(
  input: ListCreatorPublicPostsInput
): Promise<CreatorPublicPostReadModel[]> {
  const rows = await findCreatorFeedPostsByCreatorId(input.creatorId)

  return rows.map((row) => ({
    id: row.id,
    creatorId: row.creator_id,
    content: row.content,
    visibility: row.visibility,
    price: row.price,
    status: row.status,
    createdAt: row.created_at,
    publishedAt: row.published_at ?? null,
    visibilityStatus: row.visibility_status ?? null,
    moderationStatus: row.moderation_status ?? null,
    deletedAt: row.deleted_at ?? null,
    feedVisibilityState: row.feed_visibility_state ?? null,
    isFeedVisible: row.is_feed_visible ?? null,
  }))
}
