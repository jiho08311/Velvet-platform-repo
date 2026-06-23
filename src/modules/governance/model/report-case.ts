import type {
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from "@/modules/report/types"

export type CanonicalReportCaseRow = {
  id: string
  report_case_key: string
  source_report_id: string | null
  reporter_profile_id: string | null
  target_type: ReportTargetType
  target_id: string
  reason: ReportReason
  description: string | null
  case_status: ReportStatus
  reviewed_by_profile_id: string | null
  reviewed_at: string | null
  target_snapshot: Record<string, unknown>
  reporter_snapshot: Record<string, unknown>
  decision_metadata: Record<string, unknown>
  policy_version: string
  governance_event_key: string | null
  governance_timeline_key: string | null
  created_at: string
  updated_at: string
}

export type CreateReportCaseInput = {
  reporterProfileId: string
  targetType: ReportTargetType
  targetId: string
  reason: ReportReason
  description?: string | null
}

export type UpdateReportCaseStatusInput = {
  reportCaseKey: string
  status: ReportStatus
  reviewedByProfileId: string
}
