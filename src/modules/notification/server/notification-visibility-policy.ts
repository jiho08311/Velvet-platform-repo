import { getNotificationOwnerIds } from "./get-notification-owner-ids"

export type NotificationVisibilityScope = {
  ownerIds: string[]
  hasAccessScope: boolean
}

export async function getNotificationVisibilityScope(
  userId: string,
): Promise<NotificationVisibilityScope> {
  const ownerIds = await getNotificationOwnerIds(userId)

  return {
    ownerIds,
    hasAccessScope: ownerIds.length > 0,
  }
}

export function isNotificationUserIdVisibleToScope(
  notificationUserId: string,
  scope: NotificationVisibilityScope,
): boolean {
  if (!scope.hasAccessScope) {
    return false
  }

  return scope.ownerIds.includes(notificationUserId)
}