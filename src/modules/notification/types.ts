export type NotificationId = string
export type NotificationUserId = string

export type NotificationType =
  | "subscription_created"
  | "payment_succeeded"
  | "ppv_purchased"
  | "message_received"

export type Notification = {
  id: NotificationId
  userId: NotificationUserId
  type: NotificationType
  title: string
  isRead: boolean
  createdAt: string
}