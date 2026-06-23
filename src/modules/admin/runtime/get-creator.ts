import { requireAdmin } from "@/modules/admin/runtime/require-admin"
import {
  mapAdminCreatorRow,
  type AdminCreator,
} from "@/modules/admin/mappers/admin-creator-read-model-mapper"
import { findAdminCreatorRowById } from "@/modules/admin/repositories/admin-creator-read-repository"

export async function getCreator(
  creatorId: string
): Promise<AdminCreator | null> {
  await requireAdmin()

  const data = await findAdminCreatorRowById(creatorId)

  if (!data) {
    return null
  }

  return mapAdminCreatorRow(data)
}