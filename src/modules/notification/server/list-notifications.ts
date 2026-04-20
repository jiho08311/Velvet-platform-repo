import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

import type { Notification, NotificationRow } from "../types"
import { mapNotificationRow } from "../types"
import { getNotificationVisibilityScope } from "./notification-visibility-policy"

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
    .in("user_id", scope.ownerIds)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row: NotificationRow) => mapNotificationRow(row))
}