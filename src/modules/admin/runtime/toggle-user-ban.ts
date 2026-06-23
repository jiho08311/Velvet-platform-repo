import { requireAdmin } from "./require-admin"
import { isAdminProfile } from "@/modules/admin/policies/admin-role-policy"
import {
  assertNotAdminTargetUserManagement,
  assertNotSelfUserManagement,
} from "@/modules/admin/policies/admin-user-management-policy"
import { updateAdminUserBan } from "@/modules/admin/services/admin-user-ban-service"

type ToggleUserBanParams = {
  targetUserId: string
  ban: boolean
}

export async function toggleUserBan({
  targetUserId,
  ban,
}: ToggleUserBanParams) {
  const { user } = await requireAdmin()

  assertNotSelfUserManagement({
    currentAdminId: user.id,
    targetUserId,
    errorMessage: "You cannot ban yourself",
  })

  const targetIsAdmin = await isAdminProfile(targetUserId)

  assertNotAdminTargetUserManagement({
    targetIsAdmin,
    errorMessage: "Cannot ban admin user",
  })

  await updateAdminUserBan({
    targetUserId,
    ban,
  })

  return {
    success: true,
  }
}