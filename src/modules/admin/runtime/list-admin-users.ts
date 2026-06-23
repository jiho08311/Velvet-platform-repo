import { listAdminUserRoleProfileRows } from "@/modules/admin/repositories/admin-role-read-repository"
import { requireAdmin } from "./require-admin"

export async function listAdminUsers() {
  await requireAdmin({
    roles: ["super_admin"],
  })

  const rows = await listAdminUserRoleProfileRows()

  if (rows.length === 0) {
    return []
  }

  return rows.map((item) => ({
    role: item.role,
    profile: Array.isArray(item.profiles)
      ? item.profiles[0]
      : item.profiles ?? null,
  }))
}