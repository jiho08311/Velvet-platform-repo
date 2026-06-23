import {
  getHomeFeedRuntime,
  type GetHomeFeedInput,
  type GetHomeFeedResult,
  type HomeFeedItem,
} from "@/modules/feed/runtime/get-home-feed-runtime"

export type { GetHomeFeedInput, GetHomeFeedResult, HomeFeedItem }

export async function getHomeFeed(
  input: GetHomeFeedInput,
): Promise<GetHomeFeedResult> {
  return getHomeFeedRuntime(input)
}
