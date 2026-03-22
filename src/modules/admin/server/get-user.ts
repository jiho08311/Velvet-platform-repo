import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type UserRow = {
  id: string
  email: string | null
  banned: boolean
  banned_at: string | null
  created_at: string
}

export type AdminUser = {
  id: string
  email: string | null
  banned: boolean
  bannedAt: string | null
  createdAt: string
}

export async function getUser(userId: string): Promise<AdminUser | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("users")
    .select("id, email, banned, banned_at, created_at")
    .eq("id", userId)
    .maybeSingle<UserRow>()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return {
    id: data.id,
    email: data.email,
    banned: data.banned,
    bannedAt: data.banned_at,
    createdAt: data.created_at,
  }
}