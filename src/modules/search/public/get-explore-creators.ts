import {
  getExploreCreators as getExploreCreatorsRuntime,
} from "@/modules/search/runtime/get-explore-creators"
import type { DiscoveryCreatorLinkItem } from "@/modules/search/discovery-contract"

export const PUBLIC_CONTRACT = true

export type { DiscoveryCreatorLinkItem }

export type GetExploreCreatorsInput = Parameters<
  typeof getExploreCreatorsRuntime
>[0]

export async function getExploreCreators(
  input?: GetExploreCreatorsInput
): Promise<DiscoveryCreatorLinkItem[]> {
  return getExploreCreatorsRuntime(input)
}
