import { searchPublicCreatorCards } from "@/modules/search/repositories/creator-public-card-search-repository"

type SearchUsersInput = {
  query: string
  limit?: number
}

export const SEARCH_USERS_CONTRACT_STATUS = {
  activeConsumer: "unknown",
  resultScope: "public-profile-user-search",
  creatorOnly: false,
  postSearch: false,
  compatibilityAction: "projection-only-creator-public-card",
} as const

export type UserSearchResult = {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  isCreator: boolean
}

export async function searchUsers({
  query,
  limit = 20,
}: SearchUsersInput): Promise<UserSearchResult[]> {
  const rows = await searchPublicCreatorCards({
    query,
    limit,
  })

  return rows.map((row) => ({
    id: row.user_id,
    username: row.username ?? row.creator_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    isCreator: true,
  }))
}