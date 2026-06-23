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

export type NotificationListItem = Pick<
  Notification,
  "id" | "body" | "label" | "tone" | "isRead" | "createdAt"
>

export type NotificationItemViewModel = NotificationListItem

export type NotificationBadgeSummaryViewModel = {
  unreadCount: number
  hasUnread: boolean
}

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

export type NotificationListRow = Pick<
  NotificationRow,
  "id" | "type" | "status" | "body" | "created_at" | "read_at"
>

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