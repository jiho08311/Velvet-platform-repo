import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type CreateNotificationInput = {
  userId: string
  type: string
  title: string
  body: string
  data?: Record<string, unknown>
}

export async function createNotification(input: CreateNotificationInput) {
  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    status: "unread",
    title: input.title,
    body: input.body,
    data: input.data ?? {},
    read_at: null,
  })

  if (error) {
    throw error
  }
}