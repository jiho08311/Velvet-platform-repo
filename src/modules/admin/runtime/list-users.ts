import { requireAdmin } from "./require-admin"
import {
  buildAdminUserOperationalModel,
  type AdminUserOperationalModel,
} from "@/modules/admin/mappers/admin-user-operational-mapper"
import { listAdminUserOperationalRows } from "@/modules/admin/repositories/admin-user-read-repository"

type ListUsersParams = {
  limit?: number
}

export async function listUsers(
  params: ListUsersParams = {}
): Promise<AdminUserOperationalModel[]> {
  await requireAdmin()

  const limit = Math.min(params.limit ?? 50, 100)
  const rows = await listAdminUserOperationalRows(limit)

  return rows.map(buildAdminUserOperationalModel)
}