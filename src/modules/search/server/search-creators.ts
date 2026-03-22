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
  console.log("SEARCH_QUERY", query)

  if (!query) {
    return []
  }

  const limit = Math.max(1, Math.min(input.limit ?? 10, 50))

  const searchFilter = `username.ilike.%${query}%,display_name.ilike.%${query}%`
  console.log("SEARCH_FILTER", searchFilter)

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
    .or(searchFilter, {
      foreignTable: "profiles",
    })
    .limit(limit)

  console.log("SEARCH_CREATORS_RAW_DATA", data)
  console.log("SEARCH_CREATORS_RAW_ERROR", error)

  if (error) {
    throw error
  }

  const result = ((data ?? []) as CreatorRow[])
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
    })

  console.log("SEARCH_CREATORS_RESULT", result)

  return result
}