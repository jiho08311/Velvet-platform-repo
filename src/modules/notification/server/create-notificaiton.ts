import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

export type CreateNotificationInput = {
  userId: string
  type: string
  title: string
  body: string
}

type NotificationRow = {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  is_read: boolean
  created_at: string
}

export type CreatedNotification = {
  id: string
  userId: string
  type: string
  title: string
  body: string
  isRead: boolean
  createdAt: string
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<CreatedNotification> {
  const userId = input.userId.trim()
  const type = input.type.trim()
  const title = input.title.trim()
  const body = input.body.trim()

  if (!userId) {
    throw new Error("User id is required")
  }

  if (!type) {
    throw new Error("Type is required")
  }

  if (!title) {
    throw new Error("Title is required")
  }

  if (!body) {
    throw new Error("Body is required")
  }

  const supabase = await createSupabaseServerClient()
  const createdAt = new Date().toISOString()

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      type,
      title,
      body,
      is_read: false,
      created_at: createdAt,
    })
    .select("id, user_id, type, title, body, is_read, created_at")
    .single<NotificationRow>()

  if (error) {
    throw error
  }

  return {
    id: data.id,
    userId: data.user_id,
    type: data.type,
    title: data.title,
    body: data.body,
    isRead: data.is_read,
    createdAt: data.created_at,
  }
}