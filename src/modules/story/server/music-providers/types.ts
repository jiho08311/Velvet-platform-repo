import type { StoryMusicSearchItem } from "../../types"

export type SearchStoryMusicProviderInput = {
  query: string
  limit?: number
  market?: string
}

export type StoryMusicProvider = {
  searchTracks(
    input: SearchStoryMusicProviderInput
  ): Promise<StoryMusicSearchItem[]>
}