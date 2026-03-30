import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

import { getNotificationOwnerIds } from "./get-notification-owner-ids"

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
  const ownerIds = await getNotificationOwnerIds(userId)

  if (ownerIds.length === 0) {
    return 0
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id")
    .in("user_id", ownerIds)
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
    .update({
      status: "read",
      read_at: readAt,
    })
    .in("user_id", ownerIds)
    .is("read_at", null)

  if (updateError) {
    throw updateError
  }

  return unreadNotifications.length
}