import { getReadyPostMediaRowsByPostIds } from "@/modules/media/public/get-ready-post-media"
import { mapHomeFeedMediaByPostId } from "./home-feed-runtime-mappers"
import type { HomeFeedPostRow } from "./home-feed-runtime-types"

export async function loadPublishedHomeFeedMediaMap(
  filteredPosts: Array<{
    post: HomeFeedPostRow
    publicState: string
  }>
) {
  const publishedPostIds = filteredPosts
    .filter(({ publicState }) => publicState === "published")
    .map(({ post }) => post.id)
  const mediaRows = await getReadyPostMediaRowsByPostIds(publishedPostIds)
  return mapHomeFeedMediaByPostId(mediaRows)
}
