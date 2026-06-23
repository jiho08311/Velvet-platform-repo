import { getExplorePostsRuntime } from "@/modules/search/runtime/get-explore-posts-runtime"
import type { DiscoveryPostLinkItem } from "@/modules/search/discovery-contract"

export async function getExplorePosts(
  limit = 24,
): Promise<DiscoveryPostLinkItem[]> {
  return getExplorePostsRuntime(limit)
}
