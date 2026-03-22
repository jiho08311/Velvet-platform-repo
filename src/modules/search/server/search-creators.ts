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
  is_verified: boolean
  profiles:
    | {
        username: string
        display_name: string | null
        avatar_url: string | null
      }[]
    | null
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
      `
        id,
        profile_id,
        is_verified,
        profiles!inner (
          username,
          display_name,
          avatar_url
        )
      `
    )
    .or("username.ilike.%,display_name.ilike.%".replace("%", `%${query}%`), {
      foreignTable: "profiles",
    })
    .limit(limit)

  if (error) {
    throw error
  }

  return ((data ?? []) as CreatorRow[])
  .filter((row) => row.profiles && row.profiles.length > 0)
  .map((row) => {
    const profile = row.profiles![0]

    return {
      id: row.id,
      profileId: row.profile_id,
      username: profile.username,
      displayName: profile.display_name ?? profile.username,
      headline: "",
      avatarUrl: profile.avatar_url,
      isVerified: row.is_verified,
    }
  })}