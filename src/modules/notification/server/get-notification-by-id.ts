import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type GetNotificationByIdParams = {
  notificationId: string
  userId: string
}

export async function getNotificationById({
  notificationId,
  userId,
}: GetNotificationByIdParams) {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("notifications")
    .select(`
      id,
      user_id,
      type,
      title,
      body,
      status,
      data,
      created_at,
      read_at
    `)
    .eq("id", notificationId)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    throw new Error("Failed to load notification")
  }

  if (!data) {
    return null
  }

  return {
    id: data.id,
    type: data.type,
    content: data.body ?? "",
    title: data.title ?? "",
    status: data.status,
    createdAt: data.created_at,
    isRead: data.read_at !== null,
    relatedCreatorId: null,
    relatedCreatorUsername: null,
    relatedCreatorDisplayName: null,
    relatedPostId: null,
    relatedPostTitle: null,
  }
}