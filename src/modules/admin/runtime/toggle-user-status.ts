// src/modules/admin/runtime/toggle-user-status.ts

import { requireAdmin } from "./require-admin"
import { isAdminProfile } from "@/modules/admin/policies/admin-role-policy"
import {
  assertNotAdminTargetUserManagement,
  assertNotSelfUserManagement,
} from "@/modules/admin/policies/admin-user-management-policy"
import { updateAdminUserStatus } from "@/modules/admin/services/admin-user-status-service"

type ToggleUserStatusParams = {
  targetUserId: string
  deactivate: boolean
}

export async function toggleUserStatus({
  targetUserId,
  deactivate,
}: ToggleUserStatusParams) {
  const { user } = await requireAdmin()

  assertNotSelfUserManagement({
    currentAdminId: user.id,
    targetUserId,
    errorMessage: "You cannot modify your own account",
  })

  const targetIsAdmin = await isAdminProfile(targetUserId)

  assertNotAdminTargetUserManagement({
    targetIsAdmin,
    errorMessage: "Cannot deactivate admin user",
  })

  await updateAdminUserStatus({
    targetUserId,
    deactivate,
  })

  return {
    success: true,
  }
}