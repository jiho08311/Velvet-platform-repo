import type {
  NotificationBadgeTone,
  NotificationType,
} from "../types"

export const NOTIFICATION_DATA_KEYS = [
  "creatorId",
  "creatorUsername",
  "subscriberId",
  "buyerId",
  "conversationId",
  "messageId",
  "paymentId",
  "subscriptionId",
  "postId",
  "commentId",
] as const

export type NotificationDataKey = (typeof NOTIFICATION_DATA_KEYS)[number]

export const NOTIFICATION_TYPE_POLICY: Record<
  NotificationType,
  {
    label: string
    tone: NotificationBadgeTone
    dataKeys: readonly NotificationDataKey[]
  }
> = {
  subscription_started: {
    label: "Subscription",
    tone: "success",
    dataKeys: ["subscriptionId"],
  },
  subscription_canceled: {
    label: "Subscription",
    tone: "warning",
    dataKeys: ["creatorId", "subscriberId", "subscriptionId"],
  },
  ppv_message_received: {
    label: "Locked message",
    tone: "warning",
    dataKeys: ["conversationId", "messageId", "paymentId"],
  },
  ppv_message_purchased: {
    label: "Message unlocked",
    tone: "success",
    dataKeys: ["paymentId"],
  },
  ppv_post_purchased: {
    label: "Content unlocked",
    tone: "success",
    dataKeys: ["paymentId", "buyerId", "postId"],
  },
  payment_succeeded: {
    label: "Payment",
    tone: "success",
    dataKeys: ["paymentId"],
  },
  post_liked: {
    label: "Like",
    tone: "default",
    dataKeys: ["postId", "creatorId"],
  },
  comment_created: {
    label: "Comment",
    tone: "default",
    dataKeys: ["postId", "commentId", "creatorId"],
  },
  comment_liked: {
    label: "Comment like",
    tone: "default",
    dataKeys: ["postId", "commentId"],
  },
  message_received: {
    label: "Message",
    tone: "default",
    dataKeys: ["conversationId", "messageId"],
  },
}

export function getNotificationTypePolicy(type: NotificationType) {
  return NOTIFICATION_TYPE_POLICY[type]
}
