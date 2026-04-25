import { requireAdmin } from "@/modules/admin/server/require-admin"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { ReportStatus } from "@/modules/report/types"

type UpdateReportStatusParams = {
  reportId: string
  status: ReportStatus
}

type ReportRow = {
  id: string
  status: ReportStatus
  reviewed_at: string | null
}

export type UpdatedReportStatus = {
  id: string
  status: ReportStatus
  reviewedAt: string | null
}

export async function updateReportStatus({
  reportId,
  status,
}: UpdateReportStatusParams): Promise<UpdatedReportStatus> {
  const { user } = await requireAdmin()

  if (!reportId) {
    throw new Error("Report id is required")
  }

  const reviewedAt =
    status === "resolved" || status === "rejected"
      ? new Date().toISOString()
      : null

  const { data, error } = await supabaseAdmin
    .from("reports")
    .update({
      status,
      reviewed_by: user.id,
      reviewed_at: reviewedAt,
    })
    .eq("id", reportId)
    .select("id, status, reviewed_at")
    .single<ReportRow>()

  if (error) {
    throw error
  }

  return {
    id: data.id,
    status: data.status,
    reviewedAt: data.reviewed_at,
  }
}