import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type CreatorRow = {
  id: string
  user_id: string
  username: string
  created_at: string
}

export type AdminCreator = {
  id: string
  userId: string
  username: string
  createdAt: string
}

export async function getCreator(
  creatorId: string,
): Promise<AdminCreator | null> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("creators")
    .select("id, user_id, username, created_at")
    .eq("id", creatorId)
    .maybeSingle<CreatorRow>()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    username: data.username,
    createdAt: data.created_at,
  }
}