export const CREATOR_SEARCH_CONTRACT_STATUS = {
  resultScope: "creator-only",
  postSearch: "unknown",
} as const

export type CreatorSearchResult = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  headline: string | null
  isVerified: boolean
}

export type CreatorSearchConnection = {
  items: CreatorSearchResult[]
  nextCursor: string | null
}

export type CreatorSearchResponse = {
  creators: CreatorSearchConnection["items"]
  nextCursor: CreatorSearchConnection["nextCursor"]
}
