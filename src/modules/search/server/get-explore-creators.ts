import { supabaseAdmin } from "@/infrastructure/supabase/admin"

import type { CreatorSearchResult } from "../types"

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

function shuffleArray<T>(items: T[]): T[] {
  const array = [...items]

  for (let index = array.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[array[index], array[randomIndex]] = [array[randomIndex], array[index]]
  }

  return array
}

export async function getExploreCreators(
  limit = 20
): Promise<CreatorSearchResult[]> {
  const safeLimit = Math.max(1, Math.min(limit, 50))

  const { data: creatorRows, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select("id, user_id, username")
    .limit(50)

  if (creatorError) {
    throw creatorError
  }

  const creators = shuffleArray((creatorRows ?? []) as CreatorRow[]).slice(
    0,
    safeLimit
  )

  if (creators.length === 0) {
    return []
  }

  const profileIds = creators.map((creator) => creator.user_id)

  const { data: profileRows, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, username, display_name")
    .in("id", profileIds)

  if (profileError) {
    throw profileError
  }

  const profileMap = new Map(
    ((profileRows ?? []) as ProfileRow[]).map((profile) => [profile.id, profile])
  )

  return creators
    .filter((creator) => profileMap.has(creator.user_id))
    .map((creator) => {
      const profile = profileMap.get(creator.user_id)!

      return {
        id: creator.id,
        username: creator.username,
        displayName: profile.display_name ?? profile.username,
        avatarUrl: null,
        headline: null,
        isVerified: false,
      }
    })
}