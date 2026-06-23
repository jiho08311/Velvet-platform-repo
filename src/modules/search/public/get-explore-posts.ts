import { getExplorePosts as getExplorePostsRuntime } from "@/modules/search/runtime/get-explore-posts"
import type { DiscoveryPostLinkItem } from "@/modules/search/discovery-contract"

export const PUBLIC_CONTRACT = true

export type { DiscoveryPostLinkItem }

export type GetExplorePostsInput = Parameters<typeof getExplorePostsRuntime>[0]

export async function getExplorePosts(
  input?: GetExplorePostsInput
): Promise<DiscoveryPostLinkItem[]> {
  return getExplorePostsRuntime(input)
}
