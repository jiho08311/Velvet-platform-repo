import {
  getPublicUpcomingPosts as getPublicUpcomingPostsRuntime,
  type PublicUpcomingFeedItem,
} from "@/modules/feed/runtime/get-public-upcoming-posts"

export const PUBLIC_CONTRACT = true

export type { PublicUpcomingFeedItem }

export async function getPublicUpcomingPosts(
  limit?: number
): Promise<PublicUpcomingFeedItem[]> {
  return getPublicUpcomingPostsRuntime(limit)
}
