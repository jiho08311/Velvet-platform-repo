import { resolveNotificationReadState } from "@/modules/notification/policies/notification-read-state-policy"
import type {
  Notification,
  NotificationListItem,
} from "../types"
import {
  mapNotificationListRow,
  mapNotificationRow,
} from "../mappers/notification-read-model-mapper"
import { getNotificationVisibilityScope } from "@/modules/notification/policies/notification-visibility-policy"
import {
  listNotificationBadgeRowsForOwners,
  listNotificationListRowsForOwners,
  listNotificationRowsForOwners,
} from "../repositories/notification-read-repository"

type ListNotificationsParams = {
  userId: string
}

export async function listNotifications({
  userId,
}: ListNotificationsParams): Promise<Notification[]> {
  const scope = await getNotificationVisibilityScope(userId)

  if (!scope.hasAccessScope) {
    return []
  }

  const data = await listNotificationRowsForOwners({
    ownerIds: scope.ownerIds,
  })

  const notifications = data.map((row) => mapNotificationRow(row))

  return notifications
}

export async function listNotificationItems({
  userId,
}: ListNotificationsParams): Promise<NotificationListItem[]> {
  const scope = await getNotificationVisibilityScope(userId)

  if (!scope.hasAccessScope) {
    return []
  }

  const data = await listNotificationListRowsForOwners({
    ownerIds: scope.ownerIds,
  })

  const items = data.map((row) => mapNotificationListRow(row))

  return items
}

export async function listNotificationReadStates({
  userId,
}: ListNotificationsParams): Promise<Array<{ isRead: boolean }>> {
  const scope = await getNotificationVisibilityScope(userId)

  if (!scope.hasAccessScope) {
    return []
  }

  const data = await listNotificationBadgeRowsForOwners({
    ownerIds: scope.ownerIds,
  })

  const readStates = data.map((row) => {
    const resolved = resolveNotificationReadState(row)
    return { isRead: resolved.isRead }
  })

  return readStates
}
