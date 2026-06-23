import {
  getCreatorFeed as getCreatorFeedFromServer,
} from "@/modules/post/runtime/get-creator-feed"

export const PUBLIC_CONTRACT = true

export type GetCreatorFeedInput = Parameters<typeof getCreatorFeedFromServer>[0]
export type GetCreatorFeedResult = Awaited<ReturnType<typeof getCreatorFeedFromServer>>

export async function getCreatorFeed(
  input: GetCreatorFeedInput
): Promise<GetCreatorFeedResult> {
  return getCreatorFeedFromServer(input)
}
