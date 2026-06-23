import type { MarkNotificationReadResult } from "../types"
import {
  findNotificationReadStateByIdForOwners,
} from "../repositories/notification-read-repository"
import {
  insertCanonicalNotificationReadEvent,
  updateCanonicalNotificationReadState,
} from "../repositories/canonical-notification-write-repository"
import { getNotificationVisibilityScope } from "@/modules/notification/policies/notification-visibility-policy"
import {
  createMarkNotificationReadResult,
  createNotificationReadUpdate,
  resolveNotificationReadState,
} from "@/modules/notification/policies/notification-read-state-policy"

export async function markNotificationRead(
  notificationId: string,
  userId: string,
): Promise<MarkNotificationReadResult | null> {
  const scope = await getNotificationVisibilityScope(userId)

  if (!scope.hasAccessScope) {
    return null
  }

  const data = await findNotificationReadStateByIdForOwners({
    notificationId,
    ownerIds: scope.ownerIds,
  })

  if (!data) {
    return null
  }

  if (resolveNotificationReadState(data).isRead) {
    const result = createMarkNotificationReadResult(data)

    return result
  }

  const readAt = new Date().toISOString()

await updateCanonicalNotificationReadState({
  notificationId,
  recipientUserIds: scope.ownerIds,
  readAt,
})

await insertCanonicalNotificationReadEvent({
  notificationId,
  recipientUserId: userId,
  readAt,
})

  const result = createMarkNotificationReadResult({
    ...data,
    status: "read",
    read_at: readAt,
  })

  return result
}
