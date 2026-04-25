import { requireAdmin } from "@/modules/admin/server/require-admin"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import {
  buildReportReviewDetailItem,
  type ReportReviewDetailAdminItem,
  type ReportReviewDetailRow,
} from "@/modules/report/server/report-review-read-model"

export async function getReportById(
  reportId: string
): Promise<ReportReviewDetailAdminItem | null> {
  await requireAdmin()

  if (!reportId) {
    return null
  }

  const { data, error } = await supabaseAdmin
    .from("reports")
    .select(`
      id,
      target_type,
      target_id,
      reason,
      description,
      status,
      created_at,
      updated_at,
      reviewed_at,
      reporter:profiles!reports_reporter_id_fkey (
        id,
        email,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq("id", reportId)
    .maybeSingle()
    .returns<ReportReviewDetailRow | null>()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return buildReportReviewDetailItem(data)
}
