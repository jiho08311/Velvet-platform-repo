import { getStories as getStoriesRuntime } from "@/modules/story/runtime/get-stories"
import type { Story } from "@/modules/story/types"

export const PUBLIC_CONTRACT = true

export type { Story }

export type GetStoriesInput = {
  viewerUserId?: string | null
}

export async function getStories(
  viewerUserId?: GetStoriesInput["viewerUserId"]
): Promise<Story[]> {
  return getStoriesRuntime(viewerUserId)
}
