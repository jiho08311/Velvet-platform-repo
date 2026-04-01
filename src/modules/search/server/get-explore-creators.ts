import { supabaseAdmin } from "@/infrastructure/supabase/admin"

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
}

export async function getExploreCreators(
  limit = 20
): Promise<ExploreCreator[]> {
  const safeLimit = Math.max(1, Math.min(limit, 50))

const { data: profileRows, error: profileError } = await supabaseAdmin
  .from("profiles")
  .select("id")
  .eq("is_deactivated", false)
  .eq("is_delete_pending", false)
  .is("deleted_at", null)

  if (profileError) {
    throw profileError
  }

  const activeUserIds = ((profileRows ?? []) as ProfileRow[]).map(
    (profile) => profile.id
  )

  if (activeUserIds.length === 0) {
    return []
  }

  const { data: creatorRows, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select("id, user_id, username, display_name, status")
    .eq("status", "active")
    .in("user_id", activeUserIds)
    .limit(safeLimit)

  if (creatorError) {
    throw creatorError
  }

  return ((creatorRows ?? []) as CreatorRow[]).map((creator) => ({
    id: creator.id,
    username: creator.username,
    displayName: creator.display_name,
  }))
}