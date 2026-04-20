import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

import { getNotificationVisibilityScope } from "./notification-visibility-policy"
import { createNotificationReadUpdate } from "./notification-read-state-policy"

type MarkAllNotificationsReadParams = {
  userId: string
}

type NotificationUnreadRow = {
  id: string
}

export async function markAllNotificationsRead({
  userId,
}: MarkAllNotificationsReadParams): Promise<number> {
  const supabase = await createSupabaseServerClient()
  const scope = await getNotificationVisibilityScope(userId)

  if (!scope.hasAccessScope) {
    return 0
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id")
    .in("user_id", scope.ownerIds)
    .is("read_at", null)

  if (error) {
    throw error
  }

  const unreadNotifications = (data ?? []) as NotificationUnreadRow[]

  if (unreadNotifications.length === 0) {
    return 0
  }

  const readAt = new Date().toISOString()

  const { error: updateError } = await supabase
    .from("notifications")
    .update(createNotificationReadUpdate(readAt))
    .in("user_id", scope.ownerIds)
    .is("read_at", null)

  if (updateError) {
    throw updateError
  }

  return unreadNotifications.length
}