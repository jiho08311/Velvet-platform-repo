import type { NotificationBadgeSummaryViewModel } from "../types"
import { listNotificationReadStates } from "./list-notifications"
import { buildNotificationBadgeSummary } from "../services/notification-badge-service"

export async function getNotificationBadgeSummary(input: {
  userId: string
}): Promise<NotificationBadgeSummaryViewModel> {
  const readStates = await listNotificationReadStates({
    userId: input.userId,
  })

  return buildNotificationBadgeSummary(readStates)
}