import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { isPublicProfileVisible } from "@/modules/creator/lib/is-public-profile-visible"

type SearchUsersInput = {
  query: string
  limit?: number
}

type SearchUserRow = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  is_deactivated: boolean | null
  is_delete_pending: boolean | null
  deleted_at: string | null
  is_banned: boolean | null
  creators: { id: string }[] | { id: string } | null
}

export async function searchUsers({
  query,
  limit = 20,
}: SearchUsersInput) {
  const trimmed = query.trim()

  if (!trimmed) return []

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select(`
      id,
      username,
      display_name,
      avatar_url,
      is_deactivated,
      is_delete_pending,
      deleted_at,
      is_banned,
      creators (
        id
      )
    `)
    .ilike("username", `%${trimmed}%`)
    .limit(limit)
    .returns<SearchUserRow[]>()

  if (error) throw error

  return ((data ?? []) as SearchUserRow[])
    .filter((row) =>
      isPublicProfileVisible({
        isDeactivated: row.is_deactivated,
        isDeletePending: row.is_delete_pending,
        deletedAt: row.deleted_at,
        isBanned: row.is_banned,
      })
    )
    .map((row) => ({
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      isCreator: Array.isArray(row.creators)
        ? row.creators.length > 0
        : !!row.creators,
    }))
}