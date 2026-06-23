import { requireAdmin } from "./require-admin"

export async function requireSuperAdmin() {
  return requireAdmin({
    roles: ["super_admin"],
  })
}