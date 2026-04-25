import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { buildCreatorIdentity } from "@/modules/creator/server/build-creator-identity"
import { isEligiblePublicDiscoveryCreator } from "@/modules/post/lib/public-discovery-inclusion"

import type { DiscoveryCreatorLinkItem } from "../types"

type CreatorRow = {
  id: string
  user_id: string
  username: string
  display_name: string | null
  status: "active" | "pending" | "suspended" | "inactive"
  profiles: {
    id: string
    username?: string | null
    display_name?: string | null
    avatar_url?: string | null
    bio?: string | null
    is_deactivated: boolean | null
    is_delete_pending: boolean | null
    deleted_at: string | null
    is_banned: boolean | null
  } | null
}

export async function getExploreCreators(
  limit = 20
): Promise<DiscoveryCreatorLinkItem[]> {
  const safeLimit = Math.max(1, Math.min(limit, 50))

  const { data: creatorRows, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select(`
      id,
      user_id,
      username,
      display_name,
      status,
      profiles (
        id,
        is_deactivated,
        is_delete_pending,
        deleted_at,
        is_banned
      )
    `)
    .eq("status", "active")
    .limit(safeLimit * 3)
    .returns<CreatorRow[]>()

  if (creatorError) {
    throw creatorError
  }

  return ((creatorRows ?? []) as CreatorRow[])
    .filter((creator) =>
      isEligiblePublicDiscoveryCreator({
        creator: {
          status: creator.status,
        },
        profile: creator.profiles,
      })
    )
    .slice(0, safeLimit)
    .map((creator) => {
      const identity = buildCreatorIdentity({
        creator,
        profile: creator.profiles,
      })

      return {
        id: identity.id,
        username: identity.username,
        displayName: identity.displayName,
        avatarUrl: identity.avatarUrl,
      }
    })
}
