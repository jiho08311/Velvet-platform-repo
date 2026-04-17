import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type SearchUsersInput = {
  query: string
  limit?: number
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
    creators (
      id
    )
  `)
  .eq("is_deactivated", false)
  .eq("is_delete_pending", false)
  .eq("is_banned", false)
  .is("deleted_at", null)
  .ilike("username", `%${trimmed}%`)
  .limit(limit)

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    isCreator: !!row.creators,
  }))
}