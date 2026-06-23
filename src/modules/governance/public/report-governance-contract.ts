import type { ReportCreationPayload, ReportStatus } from "@/modules/report/types"
import {
  executeCreateReportCaseRuntime,
  executeGetReportCaseRuntime,
  executeListReportCasesForReviewRuntime,
  executeUpdateReportCaseStatusRuntime,
} from "@/modules/governance/runtime/report-governance-runtime"

export const PUBLIC_CONTRACT = true

export type { ReportCreationPayload, ReportStatus }

export async function createReportCase(payload: ReportCreationPayload) {
  return executeCreateReportCaseRuntime(payload)
}

export async function listReportCasesForReview(
  params: { limit?: number; cursor?: string } = {}
) {
  return executeListReportCasesForReviewRuntime(params)
}

export async function getReportCase(input: {
  reportCaseKey?: string
  sourceReportId?: string
}) {
  return executeGetReportCaseRuntime(input)
}

export async function updateReportCaseStatus(input: {
  reportCaseKey: string
  status: ReportStatus
}) {
  return executeUpdateReportCaseStatusRuntime(input)
}

export async function resolveReportCase(input: { reportCaseKey: string }) {
  return updateReportCaseStatus({
    reportCaseKey: input.reportCaseKey,
    status: "resolved",
  })
}

export async function rejectReportCase(input: { reportCaseKey: string }) {
  return updateReportCaseStatus({
    reportCaseKey: input.reportCaseKey,
    status: "rejected",
  })
}
