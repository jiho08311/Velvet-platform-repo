import { supabaseAdmin } from "@/infrastructure/supabase/admin"

import type { CreateNotificationInput } from "../types"

export async function createNotification(
  input: CreateNotificationInput,
): Promise<void> {
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