import type {
  Notification,
  NotificationBadgeSummaryViewModel,
} from "../types"

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

export function buildNotificationBadgeSummary(
  notifications: readonly Pick<Notification, "isRead">[],
): NotificationBadgeSummaryViewModel {
  const unreadCount = getUnreadNotificationCount(notifications)

  return {
    unreadCount,
    hasUnread: unreadCount > 0,
  }
}