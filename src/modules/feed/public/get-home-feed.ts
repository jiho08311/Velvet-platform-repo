import {
  getHomeFeed as getHomeFeedRuntime,
  type GetHomeFeedInput,
  type GetHomeFeedResult,
  type HomeFeedItem,
} from "@/modules/feed/runtime/get-home-feed"

export const PUBLIC_CONTRACT = true

export type { GetHomeFeedInput, GetHomeFeedResult, HomeFeedItem }

export async function getHomeFeed(
  input: GetHomeFeedInput
): Promise<GetHomeFeedResult> {
  return getHomeFeedRuntime(input)
}
