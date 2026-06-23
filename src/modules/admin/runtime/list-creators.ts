import { requireAdmin } from "@/modules/admin/runtime/require-admin"
import {
  mapAdminCreatorRow,
  type AdminCreator,
} from "@/modules/admin/mappers/admin-creator-read-model-mapper"
import { listAdminCreatorRows } from "@/modules/admin/repositories/admin-creator-read-repository"

export async function listCreators(): Promise<AdminCreator[]> {
  await requireAdmin()

  const rows = await listAdminCreatorRows()

  return rows.map(mapAdminCreatorRow)
}