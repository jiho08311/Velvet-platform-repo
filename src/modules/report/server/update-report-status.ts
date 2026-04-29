import { requireAdmin } from "@/modules/admin/server/require-admin"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import type { ReportStatus } from "@/modules/report/types"
import { getReportReviewActionEligibility } from "@/modules/report/report-review-action-eligibility"

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

  // 🔥 현재 상태 조회 (추가)
  const { data: current, error: currentError } = await supabaseAdmin
    .from("reports")
    .select("id, status")
    .eq("id", reportId)
    .single<{ id: string; status: ReportStatus }>()

  if (currentError || !current) {
    throw new Error("Report not found")
  }

  // 🔥 eligibility 기반 검증 (추가)
  const eligibility = getReportReviewActionEligibility(current.status)

  const isAllowed =
    (status === "reviewing" && eligibility.canMarkReviewing) ||
    (status === "resolved" && eligibility.canResolve) ||
    (status === "rejected" && eligibility.canReject)

  if (!isAllowed) {
    throw new Error("Invalid report status transition")
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