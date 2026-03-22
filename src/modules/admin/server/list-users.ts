import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type UserRow = {
  id: string
  email: string | null
  created_at: string
}

export type AdminUser = {
  id: string
  email: string | null
  createdAt: string
}

export async function listUsers(): Promise<AdminUser[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("users")
    .select("id, email, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row: UserRow) => ({
    id: row.id,
    email: row.email,
    createdAt: row.created_at,
  }))
}