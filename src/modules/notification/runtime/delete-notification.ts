import { findNotificationIdByIdForOwners } from "../repositories/notification-read-repository"
import {
  insertCanonicalNotificationDeletedEvent,
  updateCanonicalNotificationVisibilityDeleted,
} from "../repositories/canonical-notification-write-repository"
import { getNotificationVisibilityScope } from "@/modules/notification/policies/notification-visibility-policy"

type DeleteNotificationParams = {
  notificationId: string
  userId: string
}

export async function deleteNotification({
  notificationId,
  userId,
}: DeleteNotificationParams): Promise<boolean> {
  const scope = await getNotificationVisibilityScope(userId)

  if (!scope.hasAccessScope) {
    return false
  }

  const data = await findNotificationIdByIdForOwners({
    notificationId,
    ownerIds: scope.ownerIds,
  })

  if (!data) {
    return false
  }

const deletedAt = new Date().toISOString()

await updateCanonicalNotificationVisibilityDeleted({
  notificationId,
  recipientUserIds: scope.ownerIds,
  deletedAt,
})

await insertCanonicalNotificationDeletedEvent({
  notificationId,
  recipientUserId: userId,
  deletedAt,
})

  return true
}
