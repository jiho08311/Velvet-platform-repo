import { requireUser } from "@/modules/auth/server/require-user"
import {
  getAdminRolesForProfile,
  hasAdminMembership,
  hasRequiredAdminRole,
  type AdminRole,
} from "./admin-role-policy"

type RequireAdminParams = {
  roles?: AdminRole[]
}

export async function requireAdmin(params: RequireAdminParams = {}) {
  const user = await requireUser()
  const { roles } = params

  const userRoles = await getAdminRolesForProfile(user.id)

  if (!hasAdminMembership(userRoles)) {
    throw new Error("Admin access required")
  }

  if (!hasRequiredAdminRole(userRoles, roles)) {
    throw new Error("Admin role required")
  }

  return {
    user,
    roles: userRoles,
  }
}