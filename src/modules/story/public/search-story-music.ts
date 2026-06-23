import {
  searchStoryMusic as searchStoryMusicRuntime,
} from "@/modules/story/runtime/search-story-music"
import type { StoryMusicSearchItem } from "@/modules/story/types"

export const PUBLIC_CONTRACT = true

export type { StoryMusicSearchItem }

export type SearchStoryMusicInput = {
  query: string
  limit?: number
  market?: string
}

export async function searchStoryMusic(
  input: SearchStoryMusicInput
): Promise<StoryMusicSearchItem[]> {
  return searchStoryMusicRuntime(input)
}
