import { requireAdmin } from "@/modules/admin/runtime/require-admin"
import { findAdminUserRowById } from "@/modules/admin/repositories/admin-user-read-repository"

export type AdminUser = {
  id: string
  email: string | null
  createdAt: string
}

export async function getUser(userId: string): Promise<AdminUser | null> {
  await requireAdmin()

  const data = await findAdminUserRowById(userId)

  if (!data) {
    return null
  }

  return {
    id: data.id,
    email: data.email,
    createdAt: data.created_at,
  }
}