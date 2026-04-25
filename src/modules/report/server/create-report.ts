import { requireActiveUser } from "@/modules/auth/server/require-active-user"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import {
  isReportReason,
  isReportTargetType,
  type ReportCreationPayload,
} from "@/modules/report/types"

export async function createReport({
  targetType,
  targetId,
  reason,
  description,
}: ReportCreationPayload) {
  const user = await requireActiveUser()

  if (!isReportTargetType(targetType)) {
    throw new Error("Invalid target type")
  }

  if (!targetId) {
    throw new Error("Target id is required")
  }

  if (!isReportReason(reason)) {
    throw new Error("Invalid reason")
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
