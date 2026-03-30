import { requireAdmin } from "./require-admin"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export async function listAdminUsers() {
  await requireAdmin({
    roles: ["super_admin"],
  })

  const { data, error } = await supabaseAdmin
    .from("admin_role_assignments")
    .select(`
      profile_id,
      role,
      profiles!admin_role_assignments_profile_id_fkey (
        id,
        email,
        username,
        display_name
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  if (!data || data.length === 0) {
    return []
  }

  return data.map((item) => ({
    role: item.role,
    profile: Array.isArray(item.profiles)
      ? item.profiles[0]
      : item.profiles ?? null,
  }))
}