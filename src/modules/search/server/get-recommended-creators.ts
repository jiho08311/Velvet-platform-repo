import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { buildCreatorIdentity } from "@/modules/creator/server/build-creator-identity"
import { isPublicCreatorProfileVisible } from "@/modules/creator/lib/is-public-creator-profile-visible"

import type { CreatorSearchResult } from "../types"

type GetRecommendedCreatorsInput = {
  viewerUserId: string
  limit?: number
}

type CreatorRow = {
  id: string
  user_id: string
  username: string
  status: "active" | "pending" | "suspended" | "inactive"
  created_at?: string
}

type ProfileRow = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  bio?: string | null
  is_deactivated: boolean | null
  is_delete_pending: boolean | null
  deleted_at: string | null
  is_banned: boolean | null
}

type SubscriptionRow = {
  creator_id: string
}

export async function getRecommendedCreators({
  viewerUserId,
  limit = 3,
}: GetRecommendedCreatorsInput): Promise<CreatorSearchResult[]> {
  const safeLimit = Math.max(1, Math.min(limit, 12))

  if (!viewerUserId) {
    return []
  }

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
    .select("id, user_id, username, status, created_at")
    .neq("user_id", viewerUserId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(30)
    .returns<CreatorRow[]>()

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
    .select(
      "id, username, display_name, avatar_url, is_deactivated, is_delete_pending, deleted_at, is_banned"
    )
    .in("id", profileIds)
    .returns<ProfileRow[]>()

  if (profileError) {
    throw profileError
  }

  const profileMap = new Map(
    ((profileRows ?? []) as ProfileRow[]).map((profile) => [profile.id, profile])
  )

  return filteredCreators
    .filter((creator) =>
      isPublicCreatorProfileVisible({
        creator: {
          status: creator.status,
        },
        profile: profileMap.has(creator.user_id)
          ? {
              isDeactivated:
                profileMap.get(creator.user_id)?.is_deactivated ?? null,
              isDeletePending:
                profileMap.get(creator.user_id)?.is_delete_pending ?? null,
              deletedAt: profileMap.get(creator.user_id)?.deleted_at ?? null,
              isBanned: profileMap.get(creator.user_id)?.is_banned ?? null,
            }
          : null,
      })
    )
    .slice(0, safeLimit)
    .map((creator) => {
      const profile = profileMap.get(creator.user_id)!
      const identity = buildCreatorIdentity({
        creator,
        profile,
      })

      return {
        id: identity.id,
        bio: identity.bio || null,
        username: identity.username,
        displayName: identity.displayName,
        avatarUrl: identity.avatarUrl,
        isVerified: false,
      }
    })
}
