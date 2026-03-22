import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type UnbanUserParams = {
  userId: string
}

type UserRow = {
  id: string
  banned: boolean
  banned_at: string | null
}

export type UnbannedUser = {
  id: string
  banned: boolean
  bannedAt: string | null
}

export async function unbanUser({
  userId,
}: UnbanUserParams): Promise<UnbannedUser> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("users")
    .update({
      banned: false,
      banned_at: null,
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