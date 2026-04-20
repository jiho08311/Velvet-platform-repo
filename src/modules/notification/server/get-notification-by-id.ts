import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

import type { Notification, NotificationRow } from "../types"
import { mapNotificationRow } from "../types"
import { getNotificationVisibilityScope } from "./notification-visibility-policy"

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
    .select(`
      id,
      user_id,
      type,
      status,
      title,
      body,
      data,
      created_at,
      read_at
    `)
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