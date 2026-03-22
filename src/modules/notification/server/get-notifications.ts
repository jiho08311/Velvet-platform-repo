import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type NotificationListItem = {
  id: string
  type: string
  title: string
  body: string
  isRead: boolean
  createdAt: string
}

export type GetNotificationsInput = {
  userId: string
  limit?: number
  cursor?: string | null
}

export type GetNotificationsResult = {
  items: NotificationListItem[]
  nextCursor: string | null
}

type NotificationRow = {
  id: string
  type: string
  title: string
  body: string
  is_read: boolean
  created_at: string
}

export async function getNotifications(
  input: GetNotificationsInput
): Promise<GetNotificationsResult> {
  const userId = input.userId.trim()

  if (!userId) {
    throw new Error("User id is required")
  }

  const limit = Math.max(1, Math.min(input.limit ?? 20, 100))

  let query = supabaseAdmin
    .from("notifications")
    .select("id, type, title, body, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (input.cursor) {
    query = query.lt("created_at", input.cursor)
  }

  const { data, error } = await query.returns<NotificationRow[]>()

  if (error) {
    throw error
  }

  const rows = data ?? []

  const items: NotificationListItem[] = rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    isRead: row.is_read,
    createdAt: row.created_at,
  }))

  const nextCursor =
    items.length === limit ? items[items.length - 1]?.createdAt ?? null : null

  return {
    items,
    nextCursor,
  }
}