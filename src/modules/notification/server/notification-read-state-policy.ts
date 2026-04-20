import type {
  MarkNotificationReadResult,
  NotificationRow,
  NotificationStatus,
} from "../types"

export type NotificationResolvedReadState = {
  status: NotificationStatus
  readAt: string | null
  isRead: boolean
}

export function resolveNotificationReadState(
  row: Pick<NotificationRow, "status" | "read_at">,
): NotificationResolvedReadState {
  const readAt = row.read_at
  const isRead = readAt !== null || row.status === "read"
  const status: NotificationStatus = isRead ? "read" : "unread"

  return {
    status,
    readAt,
    isRead,
  }
}

export function createNotificationReadUpdate(
  readAt: string,
): {
  status: "read"
  read_at: string
} {
  return {
    status: "read",
    read_at: readAt,
  }
}

export function createMarkNotificationReadResult(
  row: Pick<NotificationRow, "id" | "user_id" | "status" | "read_at">,
): MarkNotificationReadResult {
  const resolved = resolveNotificationReadState(row)

  return {
    id: row.id,
    userId: row.user_id,
    status: "read",
    readAt: resolved.readAt ?? row.read_at ?? new Date().toISOString(),
  }
}