import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

export type CreatorSearchResult = {
  id: string
  profileId: string
  username: string
  displayName: string
  headline: string
  avatarUrl: string | null
  isVerified: boolean
}

export type SearchCreatorsInput = {
  query: string
  limit?: number
}

type CreatorRow = {
  id: string
  profile_id: string
  username: string
  display_name: string
  headline: string
  avatar_url: string | null
  is_verified: boolean
}

export async function searchCreators(
  input: SearchCreatorsInput
): Promise<CreatorSearchResult[]> {
  const supabase = await createSupabaseServerClient()

  const query = input.query.trim()

  if (!query) {
    return []
  }

  const limit = Math.max(1, Math.min(input.limit ?? 10, 50))

  const { data, error } = await supabase
    .from("creators")
    .select(
      "id, profile_id, username, display_name, headline, avatar_url, is_verified"
    )
    .ilike("username", `%${query}%`)
    .limit(limit)

  if (error) {
    throw error
  }

  return (data ?? []).map((row: CreatorRow) => ({
    id: row.id,
    profileId: row.profile_id,
    username: row.username,
    displayName: row.display_name,
    headline: row.headline,
    avatarUrl: row.avatar_url,
    isVerified: row.is_verified,
  }))
}