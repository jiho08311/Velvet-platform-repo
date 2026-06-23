import {
  listPublicUpcomingPosts,
  type PublicUpcomingPostItem,
} from "@/modules/post/public/list-public-upcoming-posts"

export type PublicUpcomingFeedItem = PublicUpcomingPostItem

export async function getPublicUpcomingPosts(
  limit = 3
): Promise<PublicUpcomingFeedItem[]> {
  return listPublicUpcomingPosts(limit)
}