import type { StoryMusicSearchItem } from "../types"
import { itunesStoryMusicProvider } from "./music-providers/itunes-story-music-provider"

type SearchStoryMusicInput = {
  query: string
  limit?: number
  market?: string
}

function normalizeLimit(limit?: number) {
  if (typeof limit !== "number" || Number.isNaN(limit)) {
    return 10
  }

  return Math.min(25, Math.max(1, Math.floor(limit)))
}

export async function searchStoryMusic({
  query,
  limit,
  market,
}: SearchStoryMusicInput): Promise<StoryMusicSearchItem[]> {
  const resolvedQuery = query.trim()

  if (!resolvedQuery) {
    return []
  }

  const resolvedLimit = normalizeLimit(limit)

  const items = await itunesStoryMusicProvider.searchTracks({
    query: resolvedQuery,
    limit: resolvedLimit,
    market,
  })

  return items
    .filter((item) => !!item.previewUrl && item.previewUrl.trim().length > 0)
    .slice(0, resolvedLimit)
}