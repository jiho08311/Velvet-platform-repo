import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { requireAdmin } from "@/modules/admin/server/require-admin"
type ProfileRow = {
  id: string
  email: string | null
  created_at: string
}

export type AdminUser = {
  id: string
  email: string | null
  createdAt: string
}

export async function getUser(userId: string): Promise<AdminUser | null> 
{
  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, created_at")
    .eq("id", userId)
    .maybeSingle<ProfileRow>()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return {
    id: data.id,
    email: data.email,
    createdAt: data.created_at,
  }
}