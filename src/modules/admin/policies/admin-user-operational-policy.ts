import type { AdminUserOperationalBadge } from "@/modules/admin/mappers/admin-user-operational-mapper"

export type AdminUserManagementState = {
  isSelf: boolean
  isAdminUser: boolean
  canManage: boolean
  managementBadges: AdminUserOperationalBadge[]
}

export function resolveAdminUserManagementState(input: {
  userId: string
  currentAdminId: string
  adminUserIdSet: Set<string>
}): AdminUserManagementState {
  const isSelf = input.userId === input.currentAdminId
  const isAdminUser = input.adminUserIdSet.has(input.userId)
  const managementBadges: AdminUserOperationalBadge[] = []

  if (isSelf) {
    managementBadges.push({ label: "self" })
  }

  if (!isSelf && isAdminUser) {
    managementBadges.push({ label: "admin" })
  }

  return {
    isSelf,
    isAdminUser,
    canManage: !isSelf && !isAdminUser,
    managementBadges,
  }
}