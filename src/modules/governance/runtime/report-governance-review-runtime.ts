import { requireAdmin } from "@/modules/admin/public/require-admin"
import {
  findCanonicalReportCaseByKey,
  findCanonicalReportCaseBySourceReportId,
  listCanonicalReportCases,
  updateCanonicalReportCaseStatus,
} from "@/modules/governance/repositories/report-case-repository"
import { getReportReviewActionEligibility } from "@/modules/report/report-review-action-eligibility"
import {
  isReportStatus,
  type ReportStatus,
} from "@/modules/report/types"

export async function executeListReportCasesForReviewRuntime(
  params: { limit?: number; cursor?: string } = {}
) {
  const limit = Math.min(params.limit ?? 50, 100)
  const rows = await listCanonicalReportCases({
    limit,
    cursor: params.cursor,
  })

  return {
    data: rows,
    nextCursor:
      rows.length === limit ? rows[rows.length - 1]?.created_at ?? null : null,
  }
}

export async function executeGetReportCaseRuntime(input: {
  reportCaseKey?: string
  sourceReportId?: string
}) {
  if (input.reportCaseKey) {
    return findCanonicalReportCaseByKey(input.reportCaseKey)
  }

  if (input.sourceReportId) {
    return findCanonicalReportCaseBySourceReportId(input.sourceReportId)
  }

  return null
}

export async function executeUpdateReportCaseStatusRuntime(input: {
  reportCaseKey: string
  status: ReportStatus
}) {
  const { user } = await requireAdmin()

  if (!input.reportCaseKey) {
    throw new Error("Report case key is required")
  }

  if (!isReportStatus(input.status)) {
    throw new Error("Invalid report status")
  }

  const current = await findCanonicalReportCaseByKey(input.reportCaseKey)

  if (!current) {
    throw new Error("Report not found")
  }

  const eligibility = getReportReviewActionEligibility(current.case_status)
  const isAllowed =
    (input.status === "reviewing" && eligibility.canMarkReviewing) ||
    (input.status === "resolved" && eligibility.canResolve) ||
    (input.status === "rejected" && eligibility.canReject)

  if (!isAllowed) {
    throw new Error("Invalid report status transition")
  }

  return updateCanonicalReportCaseStatus({
    reportCaseKey: input.reportCaseKey,
    status: input.status,
    reviewedByProfileId: user.id,
  })
}
