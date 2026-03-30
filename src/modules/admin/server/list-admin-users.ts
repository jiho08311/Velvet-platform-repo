import { requireAdmin } from "./require-admin"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export async function listAdminUsers() {
  await requireAdmin({
    roles: ["super_admin"],
  })

  // 1. admin assignments 가져오기
  const { data: assignments, error: assignmentError } =
    await supabaseAdmin
      .from("admin_role_assignments")
      .select("profile_id, role")
      .order("created_at", { ascending: false })

  if (assignmentError) {
    throw assignmentError
  }

  if (!assignments || assignments.length === 0) {
    return []
  }

  const profileIds = assignments.map((a) => a.profile_id)

  // 2. profiles 조회 (RLS 안전)
  const { data: profiles, error: profileError } =
    await supabaseAdmin
      .from("profiles")
      .select("id, email, username, display_name")
      .in("id", profileIds)

  if (profileError) {
    throw profileError
  }

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p])
  )

  // 3. merge
  return assignments.map((a) => ({
    role: a.role,
    profile: profileMap.get(a.profile_id) ?? null,
  }))
}