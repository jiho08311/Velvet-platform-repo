import { getReportCase, updateReportCaseStatus } from "@/modules/governance/public/report-governance-contract"
import type { ReportStatus } from "@/modules/report/types"

type UpdateReportStatusParams = {
  reportId: string
  status: ReportStatus
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
  const reportCase =
    (await getReportCase({ sourceReportId: reportId })) ??
    (await getReportCase({ reportCaseKey: reportId }))

  if (!reportCase) {
    throw new Error("Report not found")
  }

  const updated = await updateReportCaseStatus({
    reportCaseKey: reportCase.report_case_key,
    status,
  })

  return {
    id: updated.source_report_id ?? updated.report_case_key,
    status: updated.case_status,
    reviewedAt: updated.reviewed_at,
  }
}
