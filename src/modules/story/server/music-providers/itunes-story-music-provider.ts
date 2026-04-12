import type { StoryMusicSearchItem } from "../../types"
import type {
  SearchStoryMusicProviderInput,
  StoryMusicProvider,
} from "./types"

type ITunesSearchResponse = {
  results?: ITunesTrack[]
}

type ITunesTrack = {
  trackId?: number
  trackName?: string
  artistName?: string
  artworkUrl100?: string
  previewUrl?: string
  trackTimeMillis?: number
}

const ITUNES_SEARCH_URL = "https://itunes.apple.com/search"

function normalizeLimit(limit?: number) {
  if (typeof limit !== "number" || Number.isNaN(limit)) {
    return 10
  }

  return Math.min(25, Math.max(1, Math.floor(limit)))
}

function normalizeMarket(market?: string) {
  const value = market?.trim().toUpperCase()

  if (!value) {
    return "KR"
  }

  return value
}

function mapTrackToStoryMusicSearchItem(
  track: ITunesTrack
): StoryMusicSearchItem | null {
  const trackId =
    typeof track.trackId === "number" ? String(track.trackId) : ""

  const title = track.trackName?.trim() ?? ""
  const artist = track.artistName?.trim() ?? ""
  const previewUrl = track.previewUrl?.trim() ?? ""

  if (!trackId || !title || !artist || !previewUrl) {
    return null
  }

  return {
    trackId,
    title,
    artist,
    artworkUrl: track.artworkUrl100?.trim() || null,
    previewUrl,
    duration:
      typeof track.trackTimeMillis === "number"
        ? Math.floor(track.trackTimeMillis / 1000)
        : null,
    source: "external",
  }
}

export const itunesStoryMusicProvider: StoryMusicProvider = {
  async searchTracks({
    query,
    limit,
    market,
  }: SearchStoryMusicProviderInput): Promise<StoryMusicSearchItem[]> {
    const resolvedQuery = query.trim()

    if (!resolvedQuery) {
      return []
    }

    const resolvedLimit = normalizeLimit(limit)
    const resolvedMarket = normalizeMarket(market)

    const searchParams = new URLSearchParams({
      term: resolvedQuery,
      media: "music",
      entity: "song",
      country: resolvedMarket.toLowerCase(),
      limit: String(resolvedLimit),
    })

    const response = await fetch(
      `${ITUNES_SEARCH_URL}?${searchParams.toString()}`,
      {
        method: "GET",
        cache: "no-store",
      }
    )

    if (!response.ok) {
      throw new Error("Failed to search story music")
    }

    const data = (await response.json()) as ITunesSearchResponse

    return (data.results ?? [])
      .map(mapTrackToStoryMusicSearchItem)
      .filter(
        (item): item is StoryMusicSearchItem =>
          item !== null && !!item.previewUrl
      )
  },
}