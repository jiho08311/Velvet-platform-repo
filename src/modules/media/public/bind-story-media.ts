import {
  findStoryMediaBindingsByStoryIds as findStoryMediaBindings,
} from "@/modules/media/repositories/story-media-binding-repository"

export const PUBLIC_CONTRACT = true

export type StoryMediaBindingRow = Awaited<
  ReturnType<typeof findStoryMediaBindings>
>[number]

export async function findStoryMediaBindingsByStoryIds(
  storyIds: string[]
): Promise<StoryMediaBindingRow[]> {
  return findStoryMediaBindings(storyIds)
}
