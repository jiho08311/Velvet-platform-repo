import { listReportCasesForReview } from "@/modules/governance/public/report-governance-contract"
import { buildReportReviewListItem } from "@/modules/report/runtime/report-review-read-model"
import type { ReportReviewListAdminItem }
  from "@/modules/report/runtime/report-review-read-model"

export const PUBLIC_CONTRACT = true

export type ListReportsParams = {
  limit?: number
  cursor?: string
}

export type ListReportsResult = {
  data: ReportReviewListAdminItem[]
  nextCursor: string | null
}

export async function listReports(
  params: ListReportsParams = {}
): Promise<ListReportsResult> {
  const result = await listReportCasesForReview(params)

  return {
  data: result.data.map((reportCase) =>
  buildReportReviewListItem({
    id: reportCase.id,
    target_type: reportCase.target_type,
    target_id: reportCase.target_id,
    reason: reportCase.reason,
    description: reportCase.description,
    status: reportCase.case_status,
    created_at: reportCase.created_at,
    reporter: null,
  })
),
    nextCursor: result.nextCursor,
  }
}
