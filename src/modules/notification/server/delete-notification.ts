import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

import { getNotificationVisibilityScope } from "./notification-visibility-policy"

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
  const scope = await getNotificationVisibilityScope(userId)

  if (!scope.hasAccessScope) {
    return false
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id")
    .eq("id", notificationId)
    .in("user_id", scope.ownerIds)
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
    .in("user_id", scope.ownerIds)

  if (deleteError) {
    throw deleteError
  }

  return true
}