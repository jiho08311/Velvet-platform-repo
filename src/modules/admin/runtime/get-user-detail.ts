import { requireAdmin } from "./require-admin"
import {
  buildAdminUserOperationalModel,
  type AdminUserOperationalModel,
} from "@/modules/admin/mappers/admin-user-operational-mapper"
import {
  buildAdminUserCreatorDetailModel,
  type AdminUserCreatorDetailModel,
} from "@/modules/admin/mappers/admin-creator-detail-mapper"
import {
  findAdminCreatorDetailRowByUserId,
} from "@/modules/admin/repositories/admin-creator-read-repository"
import {
  getAdminUserOperationalRowById,
} from "@/modules/admin/repositories/admin-user-read-repository"

type GetUserDetailParams = {
  userId: string
}

type GetUserDetailResult = {
  profile: AdminUserOperationalModel
  creator: AdminUserCreatorDetailModel | null
}

export async function getUserDetail({
  userId,
}: GetUserDetailParams): Promise<GetUserDetailResult> {
  await requireAdmin()

  const profile = await getAdminUserOperationalRowById(userId)
  const creator = await findAdminCreatorDetailRowByUserId(userId)

  return {
    profile: buildAdminUserOperationalModel(profile),
    creator: creator ? buildAdminUserCreatorDetailModel(creator) : null,
  }
}