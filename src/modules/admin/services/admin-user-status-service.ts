// src/modules/admin/services/admin-user-status-service.ts

import { updateUserDeactivatedState } from "@/modules/admin/repositories/admin-user-write-repository"

type UpdateAdminUserStatusInput = {
  targetUserId: string
  deactivate: boolean
}

export async function updateAdminUserStatus({
  targetUserId,
  deactivate,
}: UpdateAdminUserStatusInput) {
  await updateUserDeactivatedState({
    targetUserId,
    deactivate,
  })
}