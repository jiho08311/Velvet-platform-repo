import { readCreatorIdentityByUserId } from "@/modules/identity/public/read-creator-identity"
import { listVisibleNotificationOwnerIds } from "../repositories/notification-read-repository"



export type NotificationVisibilityScope = {
  ownerIds: string[]
  hasAccessScope: boolean
}

export async function getNotificationVisibilityScope(
  userId: string,
): Promise<NotificationVisibilityScope> {
  const legacyOwnerIds = await getNotificationOwnerIds(userId)

  if (legacyOwnerIds.length === 0) {
    return {
      ownerIds: [],
      hasAccessScope: false,
    }
  }

const ownerIds = await listVisibleNotificationOwnerIds(legacyOwnerIds)

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

async function getNotificationOwnerIds(userId: string): Promise<string[]> {
  const safeUserId = userId.trim()

  if (!safeUserId) {
    return []
  }

  const ownerIds = new Set<string>([safeUserId])
  const creator = await readCreatorIdentityByUserId(safeUserId)

  if (creator?.id) {
    ownerIds.add(creator.id)
  }

  return [...ownerIds]
}