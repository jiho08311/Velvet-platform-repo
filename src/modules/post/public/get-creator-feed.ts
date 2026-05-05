import {
  getCreatorFeed as getCreatorFeedFromServer,
  type GetCreatorFeedInput,
} from "@/modules/post/server/get-creator-feed"

export type { GetCreatorFeedInput }

export async function getCreatorFeed(input: GetCreatorFeedInput) {
  return getCreatorFeedFromServer(input)
}