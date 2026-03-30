import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

import { getNotificationOwnerIds } from "./get-notification-owner-ids"

type DeleteNotificationParams = {
  notificationId: string
  userId: string
}

type NotificationRow = {
  id: string
}

export async function deleteNotification({
  notificationId,
  userId,
}: DeleteNotificationParams): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  const ownerIds = await getNotificationOwnerIds(userId)

  if (ownerIds.length === 0) {
    return false
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id")
    .eq("id", notificationId)
    .in("user_id", ownerIds)
    .maybeSingle<NotificationRow>()

  if (error) {
    throw error
  }

  if (!data) {
    return false
  }

  const { error: deleteError } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .in("user_id", ownerIds)

  if (deleteError) {
    throw deleteError
  }

  return true
}