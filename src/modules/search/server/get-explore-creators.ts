import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { isPublicCreatorProfileVisible } from "@/modules/creator/lib/is-public-creator-profile-visible"

export type ExploreCreator = {
  id: string
  username: string
  displayName: string | null
}

type CreatorRow = {
  id: string
  user_id: string
  username: string
  display_name: string | null
  status: "active" | "pending" | "suspended" | "inactive"
}

type ProfileRow = {
  id: string
  is_deactivated: boolean | null
  is_delete_pending: boolean | null
  deleted_at: string | null
  is_banned: boolean | null
}

export async function getExploreCreators(
  limit = 20
): Promise<ExploreCreator[]> {
  const safeLimit = Math.max(1, Math.min(limit, 50))

  const { data: profileRows, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, is_deactivated, is_delete_pending, deleted_at, is_banned")
    .returns<ProfileRow[]>()

  if (profileError) {
    throw profileError
  }

  const visibleProfileIds = (profileRows ?? [])
    .filter((profile) =>
      isPublicCreatorProfileVisible({
        creator: {
          status: "active",
        },
        profile: {
          isDeactivated: profile.is_deactivated,
          isDeletePending: profile.is_delete_pending,
          deletedAt: profile.deleted_at,
          isBanned: profile.is_banned,
        },
      })
    )
    .map((profile) => profile.id)

  if (visibleProfileIds.length === 0) {
    return []
  }

  const { data: creatorRows, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select("id, user_id, username, display_name, status")
    .eq("status", "active")
    .in("user_id", visibleProfileIds)
    .limit(safeLimit)
    .returns<CreatorRow[]>()

  if (creatorError) {
    throw creatorError
  }

  return ((creatorRows ?? []) as CreatorRow[])
    .filter((creator) =>
      isPublicCreatorProfileVisible({
        creator: {
          status: creator.status,
        },
        profile: {
          isDeactivated: false,
          isDeletePending: false,
          deletedAt: null,
          isBanned: false,
        },
      })
    )
    .map((creator) => ({
      id: creator.id,
      username: creator.username,
      displayName: creator.display_name,
    }))
}