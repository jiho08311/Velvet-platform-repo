import { createReportCase } from "@/modules/governance/public/report-governance-contract"
import type { ReportCreationPayload } from "@/modules/report/types"

export async function createReport(payload: ReportCreationPayload) {
  return createReportCase(payload)
}
