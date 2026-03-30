import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

import type { Notification, NotificationRow } from "../types"
import { mapNotificationRow } from "../types"

type GetNotificationByIdParams = {
  notificationId: string
  userId: string
}

export async function getNotificationById({
  notificationId,
  userId,
}: GetNotificationByIdParams): Promise<Notification | null> {
  const supabase = await createSupabaseServerClient()

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
    .eq("user_id", userId)
    .maybeSingle<NotificationRow>()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return mapNotificationRow(data)
}