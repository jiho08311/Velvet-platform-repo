import { resolveNotificationReadState } from "./server/notification-read-state-policy"
import {
  NOTIFICATION_DATA_KEYS,
  getNotificationTypePolicy,
} from "./server/notification-type-policy"

export const NOTIFICATION_TYPES = [
  "subscription_started",
  "subscription_canceled",
  "ppv_message_received",
  "ppv_message_purchased",
  "ppv_post_purchased",
  "payment_succeeded",

  // 🔥 추가
  "post_liked",
  "comment_created",
  "comment_liked",
  "message_received",
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export const NOTIFICATION_STATUSES = [
  "unread",
  "read",
] as const

export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number]

export type NotificationBadgeTone =
  | "default"
  | "neutral"
  | "subtle"
  | "info"
  | "success"
  | "warning"
  | "danger"

export type NotificationData = {
  creatorId?: string
  creatorUsername?: string
  subscriberId?: string
  buyerId?: string
  conversationId?: string
  messageId?: string
  paymentId?: string
  subscriptionId?: string

  // 🔥 추가 (optional)
  postId?: string
  commentId?: string
}

export type NotificationRow = {
  id: string
  user_id: string
  type: NotificationType
  status: NotificationStatus
  title: string
  body: string
  data: unknown | null
  created_at: string
  read_at: string | null
}

export type Notification = {
  id: string
  userId: string
  type: NotificationType
  status: NotificationStatus
  title: string
  body: string
  data: NotificationData
  createdAt: string
  readAt: string | null
  isRead: boolean
  label: string
  tone: NotificationBadgeTone
}

export type NotificationListItem = Notification

export type CreateNotificationInput = {
  userId: string
  type: NotificationType
  title: string
  body: string
  data?: NotificationData
}

export type MarkNotificationReadResult = {
  id: string
  userId: string
  status: "read"
  readAt: string
}

export function isNotificationType(
  value: string,
): value is NotificationType {
  return (NOTIFICATION_TYPES as readonly string[]).includes(value)
}

export function isNotificationStatus(
  value: string,
): value is NotificationStatus {
  return (NOTIFICATION_STATUSES as readonly string[]).includes(value)
}

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

export function getUnreadNotificationCount(
  notifications: readonly Pick<Notification, "isRead">[],
): number {
  return notifications.reduce((count, notification) => {
    return notification.isRead ? count : count + 1
  }, 0)
}

export function hasUnreadNotifications(
  notifications: readonly Pick<Notification, "isRead">[],
): boolean {
  return getUnreadNotificationCount(notifications) > 0
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
