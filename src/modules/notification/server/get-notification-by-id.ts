import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

import type { Notification, NotificationRow } from "../types"
import { mapNotificationRow } from "../types"
import { getNotificationVisibilityScope } from "./notification-visibility-policy"
import { NOTIFICATION_ROW_SELECT } from "./notification-row-query"

type GetNotificationByIdParams = {
  notificationId: string
  userId: string
}

export async function getNotificationById({
  notificationId,
  userId,
}: GetNotificationByIdParams): Promise<Notification | null> {
  const supabase = await createSupabaseServerClient()
  const scope = await getNotificationVisibilityScope(userId)

  if (!scope.hasAccessScope) {
    return null
  }

  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_ROW_SELECT)
    .eq("id", notificationId)
    .in("user_id", scope.ownerIds)
    .maybeSingle<NotificationRow>()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return mapNotificationRow(data)
}
