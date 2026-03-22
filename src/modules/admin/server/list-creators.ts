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

export async function listCreators(): Promise<AdminCreator[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("creators")
    .select("id, user_id, username, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row: CreatorRow) => ({
    id: row.id,
    userId: row.user_id,
    username: row.username,
    createdAt: row.created_at,
  }))
}