import { getReportReviewActionEligibility } from "@/modules/report/report-review-action-eligibility"
import type { CanonicalReportCaseRow } from "@/modules/governance/model/report-case"
import type {
  ReportReviewDetailItem,
  ReportReviewListItem,
  ReportTargetReference,
} from "@/modules/report/types"

function buildTargetReference(row: CanonicalReportCaseRow): ReportTargetReference {
  return {
    type: row.target_type,
    id: row.target_id,
    label: null,
    href: null,
    missing: true,
  }
}

function publicReportId(row: CanonicalReportCaseRow): string {
  return row.source_report_id ?? row.report_case_key
}

export function buildReportCaseListItem(
  row: CanonicalReportCaseRow
): ReportReviewListItem {
  return {
    id: publicReportId(row),
    targetType: row.target_type,
    targetId: row.target_id,
    targetReference: buildTargetReference(row),
    reason: row.reason,
    description: row.description,
    status: row.case_status,
    actionEligibility: getReportReviewActionEligibility(row.case_status),
    createdAt: row.created_at,
    reporter: null,
  }
}

export function buildReportCaseDetailItem(
  row: CanonicalReportCaseRow
): ReportReviewDetailItem {
  return {
    id: publicReportId(row),
    targetType: row.target_type,
    targetId: row.target_id,
    reason: row.reason,
    description: row.description,
    status: row.case_status,
    actionEligibility: getReportReviewActionEligibility(row.case_status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reviewedAt: row.reviewed_at,
    reporter: null,
    targetReference: buildTargetReference(row),
  }
}
