import { supabaseAdmin } from "@/infrastructure/supabase/admin"

import type { CreatorSearchResult } from "../types"

type GetRecommendedCreatorsInput = {
  viewerUserId: string
  limit?: number
}

type CreatorRow = {
  id: string
  user_id: string
  username: string
  created_at?: string
}

type ProfileRow = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

type SubscriptionRow = {
  creator_id: string
}

export async function getRecommendedCreators({
  viewerUserId,
  limit = 3,
}: GetRecommendedCreatorsInput): Promise<CreatorSearchResult[]> {
  const safeLimit = Math.max(1, Math.min(limit, 12))

  const { data: subscriptionRows, error: subscriptionError } = await supabaseAdmin
    .from("subscriptions")
    .select("creator_id")
    .eq("user_id", viewerUserId)
    .eq("status", "active")

  if (subscriptionError) {
    throw subscriptionError
  }

  const subscribedCreatorIds = new Set(
    ((subscriptionRows ?? []) as SubscriptionRow[]).map((row) => row.creator_id)
  )

  const { data: creatorRows, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select("id, user_id, username, created_at")
    .neq("user_id", viewerUserId)
    .order("created_at", { ascending: false })
    .limit(30)

  if (creatorError) {
    throw creatorError
  }

  const filteredCreators = ((creatorRows ?? []) as CreatorRow[]).filter(
    (creator) => !subscribedCreatorIds.has(creator.id)
  )

  if (filteredCreators.length === 0) {
    return []
  }

  const profileIds = filteredCreators.map((creator) => creator.user_id)

  const { data: profileRows, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", profileIds)
    .eq("is_deactivated", false)

  if (profileError) {
    throw profileError
  }

  const profileMap = new Map(
    ((profileRows ?? []) as ProfileRow[]).map((profile) => [profile.id, profile])
  )

  return filteredCreators
    .filter((creator) => profileMap.has(creator.user_id))
    .slice(0, safeLimit)
    .map((creator) => {
      const profile = profileMap.get(creator.user_id)!

      return {
        id: creator.id,
        bio: null,
        username: creator.username,
        displayName: profile.display_name ?? profile.username,
        avatarUrl: profile.avatar_url ?? null,
        isVerified: false,
      }
    })
}