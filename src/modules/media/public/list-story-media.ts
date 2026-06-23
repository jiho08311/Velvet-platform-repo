// src/modules/media/public/list-story-media.ts

import {
  listStoryMediaRuntime,
} from "@/modules/media/runtime/list-story-media-runtime"

export const PUBLIC_CONTRACT = true

export type ListStoryMediaInput = {
  storyIds: string[]
  requireReadyAsset?: boolean
}

export type StoryMediaItemContract = Awaited<
  ReturnType<typeof listStoryMediaRuntime>
>[number]

export async function listStoryMedia(
  input: ListStoryMediaInput
): Promise<StoryMediaItemContract[]> {
  return listStoryMediaRuntime(input)
}
