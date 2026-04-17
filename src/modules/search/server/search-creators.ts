import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { isPublicCreatorProfileVisible } from "@/modules/creator/lib/is-public-creator-profile-visible"

import type { CreatorSearchResult } from "../types"

export type SearchCreatorsInput = {
  query: string
  limit?: number
  cursor?: string | null
}

type CreatorRow = {
  id: string
  user_id: string
  username: string
  status: "active" | "pending" | "suspended"
}

type ProfileRow = {
  id: string
  username: string
  display_name: string | null
  is_deactivated: boolean | null
  is_delete_pending: boolean | null
  deleted_at: string | null
  is_banned: boolean | null
}

export async function searchCreators(
  input: SearchCreatorsInput
): Promise<{
  items: CreatorSearchResult[]
  nextCursor: string | null
}> {
  const query = input.query.trim()

  if (!query) {
    return {
      items: [],
      nextCursor: null,
    }
  }

  const limit = Math.max(1, Math.min(input.limit ?? 10, 50))
  const cursor = input.cursor?.trim() || null

  let profilesQuery = supabaseAdmin
    .from("profiles")
    .select(
      "id, username, display_name, is_deactivated, is_delete_pending, deleted_at, is_banned"
    )
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .order("username", { ascending: true })
    .limit(limit)

  if (cursor) {
    profilesQuery = profilesQuery.gt("username", cursor)
  }

  const { data: profileRows, error: profileError } = await profilesQuery

  if (profileError) {
    throw profileError
  }

  const matchedProfiles = (profileRows ?? []) as ProfileRow[]

  if (matchedProfiles.length === 0) {
    return {
      items: [],
      nextCursor: null,
    }
  }

  const profileIds = matchedProfiles.map((profile) => profile.id)

  const { data: creatorRows, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select("id, user_id, username, status")
    .in("user_id", profileIds)
    .eq("status", "active")

  if (creatorError) {
    throw creatorError
  }

  const creatorMap = new Map(
    ((creatorRows ?? []) as CreatorRow[]).map((creator) => [
      creator.user_id,
      creator,
    ])
  )

  const items = matchedProfiles
    .filter((profile) =>
      isPublicCreatorProfileVisible({
        creator: creatorMap.has(profile.id)
          ? {
              status: creatorMap.get(profile.id)?.status,
            }
          : null,
        profile: {
          isDeactivated: profile.is_deactivated,
          isDeletePending: profile.is_delete_pending,
          deletedAt: profile.deleted_at,
          isBanned: profile.is_banned,
        },
      })
    )
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

  return {
    items,
    nextCursor:
      items.length === limit
        ? matchedProfiles[matchedProfiles.length - 1]?.username ?? null
        : null,
  }
}