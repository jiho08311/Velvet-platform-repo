import {
  getRecommendedCreators as getRecommendedCreatorsRuntime,
} from "@/modules/search/runtime/get-recommended-creators"
import type { DiscoveryCreatorLinkItem } from "@/modules/search/discovery-contract"

export const PUBLIC_CONTRACT = true

export type { DiscoveryCreatorLinkItem }

export type GetRecommendedCreatorsInput = {
  viewerUserId?: string
  limit?: number
}

export async function getRecommendedCreators(
  input: GetRecommendedCreatorsInput
): Promise<DiscoveryCreatorLinkItem[]> {
  return getRecommendedCreatorsRuntime(input)
}
