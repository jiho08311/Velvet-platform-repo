import { requireUser } from "@/modules/auth/server/require-user"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type AdminRole = "super_admin" | "moderator" | "analytics_viewer"

type RequireAdminParams = {
  roles?: AdminRole[]
}

export async function requireAdmin(
  params: RequireAdminParams = {}
) {
  const user = await requireUser()
  const { roles } = params

  const { data, error } = await supabaseAdmin
    .from("admin_role_assignments")
    .select("role")
    .eq("profile_id", user.id)

  if (error) {
    throw error
  }

  if (!data || data.length === 0) {
    throw new Error("Admin access required")
  }

  const userRoles = data.map((r) => r.role as AdminRole)

  if (roles && roles.length > 0) {
    const hasRequiredRole = userRoles.some((role) =>
      roles.includes(role)
    )

    if (!hasRequiredRole) {
      throw new Error("Admin role required")
    }
  }

  return {
    user,
    roles: userRoles,
  }
}