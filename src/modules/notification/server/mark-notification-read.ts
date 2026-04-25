import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

import type {
  MarkNotificationReadResult,
  NotificationRow,
} from "../types"
import { getNotificationVisibilityScope } from "./notification-visibility-policy"
import { NOTIFICATION_READ_STATE_SELECT } from "./notification-read-row-query"
import {
  createMarkNotificationReadResult,
  createNotificationReadUpdate,
  resolveNotificationReadState,
} from "./notification-read-state-policy"

export async function markNotificationRead(
  notificationId: string,
  userId: string,
): Promise<MarkNotificationReadResult | null> {
  const supabase = await createSupabaseServerClient()
  const scope = await getNotificationVisibilityScope(userId)

  if (!scope.hasAccessScope) {
    return null
  }

  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_READ_STATE_SELECT)
    .eq("id", notificationId)
    .in("user_id", scope.ownerIds)
    .maybeSingle<NotificationRow>()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  if (resolveNotificationReadState(data).isRead) {
    return createMarkNotificationReadResult(data)
  }

  const readAt = new Date().toISOString()

  const { error: updateError } = await supabase
    .from("notifications")
    .update(createNotificationReadUpdate(readAt))
    .eq("id", notificationId)
    .in("user_id", scope.ownerIds)

  if (updateError) {
    throw updateError
  }

  return createMarkNotificationReadResult({
    ...data,
    status: "read",
    read_at: readAt,
  })
}
