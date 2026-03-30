import { requireAdmin } from "@/modules/admin/server/require-admin"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type ReportStatus = "pending" | "reviewing" | "resolved" | "rejected"

type UpdateReportStatusParams = {
  reportId: string
  status: ReportStatus
}

export async function updateReportStatus({
  reportId,
  status,
}: UpdateReportStatusParams) {
  const { user } = await requireAdmin()

  if (!reportId) {
    throw new Error("Report id is required")
  }

  const reviewedAt =
    status === "resolved" || status === "rejected"
      ? new Date().toISOString()
      : null

  const { error } = await supabaseAdmin
    .from("reports")
    .update({
      status,
      reviewed_by: user.id,
      reviewed_at: reviewedAt,
    })
    .eq("id", reportId)

  if (error) {
    throw error
  }

  return {
    success: true,
  }
}