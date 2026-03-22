import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type ModerationQueueItem = {
  id: string
  targetType: "post" | "message" | "profile"
  reason: string
  status: "pending" | "reviewed" | "resolved"
  createdAt: string
}

type ModerationRow = {
  id: string
  target_type: "post" | "message" | "profile"
  reason: string
  status: "pending" | "reviewed" | "resolved"
  created_at: string
}

export async function listModerationQueue(): Promise<ModerationQueueItem[]> {
  const { data, error } = await supabaseAdmin
    .from("moderation_queue")
    .select("id, target_type, reason, status, created_at")
    .order("created_at", { ascending: false })
    .returns<ModerationRow[]>()

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    targetType: row.target_type,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at,
  }))
}