import { createClient } from "@/infrastructure/supabase/server"

export async function getNotifications(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, user_id, type, status, title, body, data, created_at, read_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((n) => ({
    id: n.id,
    userId: n.user_id,
    type: n.type,
    title: n.title,
    body: n.body,
    data: n.data,
    createdAt: n.created_at,
    isRead: n.read_at !== null,
  }))
}