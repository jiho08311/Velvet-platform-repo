import { getPublicUpcomingPosts } from "@/modules/feed/public/get-public-upcoming-posts"

export async function listPublicUpcomingPostProjections(
  limit = 3
) {
  return getPublicUpcomingPosts(limit)
}