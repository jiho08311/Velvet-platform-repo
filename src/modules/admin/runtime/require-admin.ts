import { canAccessAdmin } from "@/modules/authorization/public"
import type { AdminRole } from "@/modules/admin/policies/admin-role-policy"

type RequireAdminParams = {
  roles?: AdminRole[]
}

export async function requireAdmin(params: RequireAdminParams = {}) {
const contract = await canAccessAdmin(params)

if (!contract.allowed) {
    throw new Error(
      contract.reason === "admin_role_required"
        ? "Admin role required"
        : "Admin access required"
    )
  }

  return {
    user: contract.user,
    roles: contract.roles,
  }
}
