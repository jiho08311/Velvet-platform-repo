import { requireActiveUser } from "@/modules/auth/server/require-active-user"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type ReportTargetType = "post" | "message" | "user" | "creator" | "comment"

type CreateReportParams = {
  targetType: ReportTargetType
  targetId: string
  reason: string
  description?: string
}

export async function createReport({
  targetType,
  targetId,
  reason,
  description,
}: CreateReportParams) {
  const user = await requireActiveUser()

  if (!targetId) {
    throw new Error("Target id is required")
  }

  if (!reason.trim()) {
    throw new Error("Reason is required")
  }

  const { data, error } = await supabaseAdmin
    .from("reports")
    .insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason,
      description: description?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}