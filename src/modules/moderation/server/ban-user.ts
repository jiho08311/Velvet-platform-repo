import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type BanUserParams = {
  userId: string
}

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

export async function banUser({
  userId,
}: BanUserParams): Promise<BannedUser> {
  const supabase = await createSupabaseServerClient()

  const bannedAt = new Date().toISOString()

  const { data, error } = await supabase
    .from("users")
    .update({
      banned: true,
      banned_at: bannedAt,
    })
    .eq("id", userId)
    .select("id, banned, banned_at")
    .single<UserRow>()

  if (error) {
    throw error
  }

  return {
    id: data.id,
    banned: data.banned,
    bannedAt: data.banned_at,
  }
}