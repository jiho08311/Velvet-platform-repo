import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type UserRow = {
  id: string
  banned: boolean
  banned_at: string | null
}

export type BannedUser = {
  id: string
  banned: boolean
  bannedAt: string | null
}

export async function listBannedUsers(): Promise<BannedUser[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("users")
    .select("id, banned, banned_at")
    .eq("banned", true)
    .order("banned_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row: UserRow) => ({
    id: row.id,
    banned: row.banned,
    bannedAt: row.banned_at,
  }))
}