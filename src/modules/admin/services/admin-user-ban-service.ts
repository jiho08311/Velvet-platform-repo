// src/modules/admin/services/admin-user-ban-service.ts

import { updateUserBannedState } from "@/modules/admin/repositories/admin-user-write-repository"

type UpdateAdminUserBanInput = {
  targetUserId: string
  ban: boolean
}

export async function updateAdminUserBan({
  targetUserId,
  ban,
}: UpdateAdminUserBanInput) {
  await updateUserBannedState({
    targetUserId,
    ban,
  })
}