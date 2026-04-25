import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { requireAdmin } from "@/modules/admin/server/require-admin"
import {
  buildModerationQueueItem,
  type ModerationQueueItem,
  type ModerationQueueRow,
} from "@/modules/moderation/server/moderation-queue-read-model"

export async function listModerationQueue(): Promise<ModerationQueueItem[]> {
  await requireAdmin()

  const { data, error } = await supabaseAdmin
    .from("moderation_queue")
    .select("id, target_type, target_id, reason, status, created_at")
    .order("created_at", { ascending: false })
    .returns<ModerationQueueRow[]>()

  if (error) {
    throw error
  }

  return (data ?? []).map(buildModerationQueueItem)
}
