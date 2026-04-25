import { updateReportStatus } from "@/modules/report/server/update-report-status"
import type { ReportStatus } from "@/modules/report/types"

type ResolveReportParams = {
  reportId: string
}

export type ResolvedReport = {
  id: string
  status: ReportStatus
  reviewedAt: string | null
}

export async function resolveReport({
  reportId,
}: ResolveReportParams): Promise<ResolvedReport> {
  return updateReportStatus({
    reportId,
    status: "resolved",
  })
}