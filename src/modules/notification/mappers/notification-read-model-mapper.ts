import { resolveNotificationReadState } from "../policies/notification-read-state-policy"
import {
  NOTIFICATION_DATA_KEYS,
  getNotificationTypePolicy,
} from "../policies/notification-type-policy"
import type {
  Notification,
  NotificationBadgeTone,
  NotificationData,
  NotificationListItem,
  NotificationListRow,
  NotificationRow,
  NotificationType,
  NotificationItemViewModel,
} from "../types"

function isNotificationDataRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function normalizeNotificationData(
  data: unknown,
  type?: NotificationType,
): NotificationData {
  if (!isNotificationDataRecord(data)) {
    return {}
  }

  const allowedKeys = type
    ? getNotificationTypePolicy(type).dataKeys
    : NOTIFICATION_DATA_KEYS

  const normalized: NotificationData = {}

  for (const key of allowedKeys) {
    const value = data[key]

    if (typeof value === "string" && value.length > 0) {
      normalized[key] = value
    }
  }

  return normalized
}

export function getNotificationPresentation(
  type: NotificationType,
): {
  label: string
  tone: NotificationBadgeTone
} {
  const policy = getNotificationTypePolicy(type)

  return {
    label: policy.label,
    tone: policy.tone,
  }
}

export function buildNotificationReadModel(
  row: NotificationRow,
): Notification {
  const resolvedReadState = resolveNotificationReadState(row)
  const presentation = getNotificationPresentation(row.type)
  const data = normalizeNotificationData(row.data, row.type)

  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    status: resolvedReadState.status,
    title: row.title,
    body: row.body,
    data,
    createdAt: row.created_at,
    readAt: resolvedReadState.readAt,
    isRead: resolvedReadState.isRead,
    label: presentation.label,
    tone: presentation.tone,
  }
}

export function mapNotificationRow(row: NotificationRow): Notification {
  return buildNotificationReadModel(row)
}

export function mapNotificationListRow(
  row: NotificationListRow,
): NotificationListItem {
  const resolvedReadState = resolveNotificationReadState(row)
  const presentation = getNotificationPresentation(row.type)

  return {
    id: row.id,
    body: row.body,
    label: presentation.label,
    tone: presentation.tone,
    isRead: resolvedReadState.isRead,
    createdAt: row.created_at,
  }
}

export function toNotificationItemViewModel(
  notification: Notification,
): NotificationItemViewModel {
  return {
    id: notification.id,
    body: notification.body,
    label: notification.label,
    tone: notification.tone,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  }
}