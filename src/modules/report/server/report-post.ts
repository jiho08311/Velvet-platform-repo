import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type ReportPostParams = {
  userId: string
  postId: string
  reason: string
}

type ReportRow = {
  id: string
  user_id: string
  target_id: string
  type: string
  reason: string
  created_at: string
}

export type Report = {
  id: string
  userId: string
  targetId: string
  type: string
  reason: string
  createdAt: string
}

export async function reportPost({
  userId,
  postId,
  reason,
}: ReportPostParams): Promise<Report> {
  const supabase = await createSupabaseServerClient()

  if (!reason || reason.trim().length === 0) {
    throw new Error("Report reason is required")
  }

  const createdAt = new Date().toISOString()

  const { data, error } = await supabase
    .from("reports")
    .insert({
      user_id: userId,
      target_id: postId,
      type: "post",
      reason,
      created_at: createdAt,
    })
    .select("id, user_id, target_id, type, reason, created_at")
    .single<ReportRow>()

  if (error) {
    throw error
  }

  return {
    id: data.id,
    userId: data.user_id,
    targetId: data.target_id,
    type: data.type,
    reason: data.reason,
    createdAt: data.created_at,
  }
}