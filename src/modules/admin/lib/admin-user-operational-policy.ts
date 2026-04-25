export type AdminUserOperationalRow = {
  id: string
  email: string | null
  username: string | null
  display_name: string | null
  is_deactivated: boolean | null
  is_banned: boolean | null
  is_delete_pending?: boolean | null
  delete_scheduled_for?: string | null
  deleted_at?: string | null
  created_at: string
}

export type AdminUserOperationalBadge = {
  label: string
}

export type AdminUserOperationalModel = {
  id: string
  email: string | null
  username: string | null
  displayName: string | null
  createdAt: string
  isActive: boolean
  isDeactivated: boolean
  isBanned: boolean
  isDeletePending: boolean
  isDeleted: boolean
  deleteScheduledFor: string | null
  deletedAt: string | null
  statusLabel: "active" | "deactivated" | "deleted"
  statusBadges: AdminUserOperationalBadge[]
}

export type AdminUserManagementState = {
  isSelf: boolean
  isAdminUser: boolean
  canManage: boolean
  managementBadges: AdminUserOperationalBadge[]
}

export type AdminUserCreatorDetailRow = {
  id: string
  status: string
  subscription_price: number
}

export type AdminUserCreatorDetailModel = {
  id: string
  status: string
  subscriptionPrice: number
  subscriptionPriceLabel: string
}

function formatCreatorSubscriptionPrice(price: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(price)
}

export function buildAdminUserOperationalModel(
  row: AdminUserOperationalRow
): AdminUserOperationalModel {
  const isDeactivated = row.is_deactivated === true
  const isBanned = row.is_banned === true
  const isDeletePending = row.is_delete_pending === true
  const isDeleted = Boolean(row.deleted_at)
  const statusLabel = isDeleted
    ? "deleted"
    : isDeactivated
      ? "deactivated"
      : "active"

  const statusBadges: AdminUserOperationalBadge[] = [
    { label: statusLabel },
  ]

  if (isBanned) {
    statusBadges.push({ label: "banned" })
  }

  if (isDeletePending) {
    statusBadges.push({ label: "delete pending" })
  }

  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    createdAt: row.created_at,
    isActive: statusLabel === "active",
    isDeactivated,
    isBanned,
    isDeletePending,
    isDeleted,
    deleteScheduledFor: row.delete_scheduled_for ?? null,
    deletedAt: row.deleted_at ?? null,
    statusLabel,
    statusBadges,
  }
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

export function buildAdminUserCreatorDetailModel(
  row: AdminUserCreatorDetailRow
): AdminUserCreatorDetailModel {
  return {
    id: row.id,
    status: row.status,
    subscriptionPrice: row.subscription_price,
    subscriptionPriceLabel: formatCreatorSubscriptionPrice(
      row.subscription_price
    ),
  }
}
