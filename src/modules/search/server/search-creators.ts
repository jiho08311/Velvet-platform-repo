import { supabaseAdmin } from "@/infrastructure/supabase/admin"

import type { CreatorSearchResult } from "../types"

export type SearchCreatorsInput = {
  query: string
  limit?: number
}

type CreatorRow = {
  id: string
  user_id: string
  username: string
}

type ProfileRow = {
  id: string
  username: string
  display_name: string | null
}

export async function searchCreators(
  input: SearchCreatorsInput
): Promise<CreatorSearchResult[]> {
  const query = input.query.trim()

  if (!query) {
    return []
  }

  const limit = Math.max(1, Math.min(input.limit ?? 10, 50))

const { data: profileRows, error: profileError } = await supabaseAdmin
  .from("profiles")
  .select("id, username, display_name")
  .eq("is_deactivated", false) // ✅ 추가
  .eq("is_delete_pending", false)
.is("deleted_at", null)
  .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
  .limit(limit)

  if (profileError) {
    throw profileError
  }

  const matchedProfiles = (profileRows ?? []) as ProfileRow[]

  if (matchedProfiles.length === 0) {
    return []
  }

  const profileIds = matchedProfiles.map((profile) => profile.id)

  const { data: creatorRows, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select("id, user_id, username")
    .in("user_id", profileIds)

  if (creatorError) {
    throw creatorError
  }

  const creatorMap = new Map(
    ((creatorRows ?? []) as CreatorRow[]).map((creator) => [
      creator.user_id,
      creator,
    ])
  )

  return matchedProfiles
    .filter((profile) => creatorMap.has(profile.id))
    .map((profile) => {
      const creator = creatorMap.get(profile.id)!

      return {
        id: creator.id,
        bio: null,
        username: creator.username,
        displayName: profile.display_name ?? profile.username,
        avatarUrl: null,
        headline: null,
        isVerified: false,
      }
    })
}