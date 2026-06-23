import { getReportCase } from "@/modules/governance/public/report-governance-contract"
import { buildReportReviewDetailItem } from "@/modules/report/runtime/report-review-read-model"
import type { ReportReviewDetailAdminItem }
  from "@/modules/report/runtime/report-review-read-model"

export const PUBLIC_CONTRACT = true

export async function getReportById(
  reportId: string
): Promise<ReportReviewDetailAdminItem | null>{
  if (!reportId) {
    return null
  }

  const reportCase =
    (await getReportCase({ sourceReportId: reportId })) ??
    (await getReportCase({ reportCaseKey: reportId }))

  if (!reportCase) {
    return null
  }

return buildReportReviewDetailItem({
  id: reportCase.id,
  target_type: reportCase.target_type,
  target_id: reportCase.target_id,
  reason: reportCase.reason,
  description: reportCase.description,
  status: reportCase.case_status,
  created_at: reportCase.created_at,
  updated_at: reportCase.updated_at,
  reviewed_at: reportCase.reviewed_at,
  reporter: null,
})
}
