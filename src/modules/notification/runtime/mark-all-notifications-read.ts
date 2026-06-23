import {
  listUnreadNotificationReadStateRowsForOwners,
} from "../repositories/notification-read-repository"

import {
  insertCanonicalAllNotificationsReadEvent,
  updateUnreadCanonicalNotificationsReadForRecipients,
} from "../repositories/canonical-notification-write-repository"


import { getNotificationVisibilityScope } from "@/modules/notification/policies/notification-visibility-policy"
import { createNotificationReadUpdate } from "@/modules/notification/policies/notification-read-state-policy"

type MarkAllNotificationsReadParams = {
  userId: string
}

export async function markAllNotificationsRead({
  userId,
}: MarkAllNotificationsReadParams): Promise<number> {
  const scope = await getNotificationVisibilityScope(userId)

  if (!scope.hasAccessScope) {
    return 0
  }

  const unreadNotifications = await listUnreadNotificationReadStateRowsForOwners({
    ownerIds: scope.ownerIds,
  })

  if (unreadNotifications.length === 0) {
    return 0
  }

  const readAt = new Date().toISOString()

await updateUnreadCanonicalNotificationsReadForRecipients({
  recipientUserIds: scope.ownerIds,
  readAt,
})

await insertCanonicalAllNotificationsReadEvent({
  recipientUserId: userId,
  readAt,
  notificationCount: unreadNotifications.length,
})

  return unreadNotifications.length
}
