import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import { resolveNotificationReadState } from "./notification-read-state-policy"
import { NOTIFICATION_BADGE_ROW_SELECT } from "./notification-row-query"
import type {
  Notification,
  NotificationListItem,
  NotificationListRow,
  NotificationRow,
} from "../types"
import { mapNotificationListRow, mapNotificationRow } from "../types"
import { getNotificationVisibilityScope } from "./notification-visibility-policy"
import {
  NOTIFICATION_LIST_ROW_SELECT,
  NOTIFICATION_ROW_SELECT,
} from "./notification-row-query"

type ListNotificationsParams = {
  userId: string
}

export async function listNotifications({
  userId,
}: ListNotificationsParams): Promise<Notification[]> {
  const supabase = await createSupabaseServerClient()
  const scope = await getNotificationVisibilityScope(userId)

  if (!scope.hasAccessScope) {
    return []
  }

  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_ROW_SELECT)
    .in("user_id", scope.ownerIds)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row: NotificationRow) => mapNotificationRow(row))
}

export async function listNotificationItems({
  userId,
}: ListNotificationsParams): Promise<NotificationListItem[]> {
  const supabase = await createSupabaseServerClient()
  const scope = await getNotificationVisibilityScope(userId)

  if (!scope.hasAccessScope) {
    return []
  }

  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_LIST_ROW_SELECT)
    .in("user_id", scope.ownerIds)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row: NotificationListRow) =>
    mapNotificationListRow(row),
  )
}

export async function listNotificationReadStates({
  userId,
}: ListNotificationsParams): Promise<Array<{ isRead: boolean }>> {
  const supabase = await createSupabaseServerClient()
  const scope = await getNotificationVisibilityScope(userId)

  if (!scope.hasAccessScope) {
    return []
  }

  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_BADGE_ROW_SELECT)
    .in("user_id", scope.ownerIds)

  if (error) {
    throw error
  }

  return (data ?? []).map((row: Pick<NotificationRow, "status" | "read_at">) => {
    const resolved = resolveNotificationReadState(row)
    return { isRead: resolved.isRead }
  })
}