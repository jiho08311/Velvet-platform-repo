import { requireAdmin } from "./require-admin"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type ListUsersParams = {
  limit?: number
}

export async function listUsers(params: ListUsersParams = {}) {
  await requireAdmin()

  const limit = Math.min(params.limit ?? 50, 100)

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select(
      "id, email, username, display_name, is_deactivated, is_banned, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return data ?? []
}