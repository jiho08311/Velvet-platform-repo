import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type ListNotificationsParams = {
  userId: string
}

export type Notification = {
  id: string
  userId: string
  type: string
  message: string
  isRead: boolean
  createdAt: string
}

export async function listNotifications({
  userId,
}: ListNotificationsParams): Promise<Notification[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("notifications")
    .select(`
      id,
      user_id,
      type,
      body,
      read_at,
      created_at
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    message: row.body ?? "",
    isRead: row.read_at !== null,
    createdAt: row.created_at,
  }))
}