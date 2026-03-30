import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

import type { Notification, NotificationRow } from "../types"
import { mapNotificationRow } from "../types"
import { getNotificationOwnerIds } from "./get-notification-owner-ids"

type ListNotificationsParams = {
  userId: string
}

export async function listNotifications({
  userId,
}: ListNotificationsParams): Promise<Notification[]> {
  const supabase = await createSupabaseServerClient()
  const ownerIds = await getNotificationOwnerIds(userId)

  if (ownerIds.length === 0) {
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
    .in("user_id", ownerIds)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row: NotificationRow) => mapNotificationRow(row))
}