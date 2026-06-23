import {
  listAdminProfileIdRows,
  listAdminRoleRowsByProfileId,
} from "@/modules/admin/repositories/admin-role-read-repository"

export type AdminRole = "super_admin" | "moderator" | "analytics_viewer"

export async function getAdminRolesForProfile(
  profileId: string
): Promise<AdminRole[]> {
  const rows = await listAdminRoleRowsByProfileId(profileId)

  return rows.map((row) => row.role)
}

export async function getAdminProfileIds(): Promise<string[]> {
  const rows = await listAdminProfileIdRows()

  return rows.map((row) => row.profile_id)
}

export async function getAdminUserIdSet(): Promise<Set<string>> {
  const ids = await getAdminProfileIds()
  return new Set(ids)
}

export async function isAdminProfile(profileId: string): Promise<boolean> {
  const roles = await getAdminRolesForProfile(profileId)
  return roles.length > 0
}

export async function hasAdminMembership(profileId: string): Promise<boolean> {
  return isAdminProfile(profileId)
}

export async function hasRequiredAdminRole({
  profileId,
  requiredRoles,
}: {
  profileId: string
  requiredRoles: AdminRole[]
}): Promise<boolean> {
  const roles = await getAdminRolesForProfile(profileId)
  return roles.some((role) => requiredRoles.includes(role))
}