import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

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
}: DeleteNotificationParams): Promise<void> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("notifications")
    .select("id")
    .eq("id", notificationId)
    .eq("user_id", userId)
    .maybeSingle<NotificationRow>()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error("Notification not found")
  }

  const { error: deleteError } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", userId)

  if (deleteError) {
    throw deleteError
  }
}