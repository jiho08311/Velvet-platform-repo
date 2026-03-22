import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

export type MarkNotificationReadResult = {
  id: string
  userId: string
  isRead: true
  readAt: string
}

type NotificationRow = {
  id: string
  user_id: string
  read_at: string | null
}

export async function markNotificationRead(
  notificationId: string,
  userId: string,
): Promise<MarkNotificationReadResult | null> {
  const id = notificationId.trim()
  const ownerUserId = userId.trim()

  if (!id || !ownerUserId) {
    return null
  }

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("notifications")
    .select("id, user_id, read_at")
    .eq("id", id)
    .eq("user_id", ownerUserId)
    .maybeSingle<NotificationRow>()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  // 이미 읽은 경우 그대로 반환
  if (data.read_at) {
    return {
      id,
      userId: ownerUserId,
      isRead: true,
      readAt: data.read_at,
    }
  }

  const readAt = new Date().toISOString()

  const { error: updateError } = await supabase
    .from("notifications")
    .update({
      read_at: readAt,
    })
    .eq("id", id)
    .eq("user_id", ownerUserId)

  if (updateError) {
    throw updateError
  }

  return {
    id,
    userId: ownerUserId,
    isRead: true,
    readAt,
  }
}