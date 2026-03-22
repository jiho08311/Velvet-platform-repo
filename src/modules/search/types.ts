export type SearchResult = {
  id: string
  type: "creator" | "post" | "profile"
  label: string
}

export type ExploreCreator = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  isCreator: boolean
}

export type CreatorSearchResult = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  headline: string | null
  isVerified: boolean
}