import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type AdminRole = "super_admin" | "moderator" | "analytics_viewer"

type AdminRoleAssignmentRow = {
  role: AdminRole
}

type AdminProfileIdRow = {
  profile_id: string
}

export async function getAdminRolesForProfile(
  profileId: string
): Promise<AdminRole[]> {
  const { data, error } = await supabaseAdmin
    .from("admin_role_assignments")
    .select("role")
    .eq("profile_id", profileId)

  if (error) {
    throw error
  }

  return ((data ?? []) as AdminRoleAssignmentRow[]).map((row) => row.role)
}

export function hasAdminMembership(roles: AdminRole[]): boolean {
  return roles.length > 0
}

export function hasRequiredAdminRole(
  roles: AdminRole[],
  requiredRoles?: AdminRole[]
): boolean {
  if (!requiredRoles || requiredRoles.length === 0) {
    return hasAdminMembership(roles)
  }

  return roles.some((role) => requiredRoles.includes(role))
}

export async function isAdminProfile(profileId: string): Promise<boolean> {
  const roles = await getAdminRolesForProfile(profileId)

  return hasAdminMembership(roles)
}

export async function getAdminUserIdSet(): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin
    .from("admin_role_assignments")
    .select("profile_id")

  if (error) {
    throw error
  }

  return new Set(
    ((data ?? []) as AdminProfileIdRow[]).map((row) => row.profile_id)
  )
}