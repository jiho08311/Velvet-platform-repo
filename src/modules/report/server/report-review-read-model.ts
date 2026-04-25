import type {
  ReportReason,
  ReportReviewDetailItem,
  ReportReviewListItem,
  ReportStatus,
  ReportTargetType,
} from "@/modules/report/types"

type ReportListReporterRow = {
  id: string
  email: string | null
  username: string | null
  display_name: string | null
}

type ReportDetailReporterRow = ReportListReporterRow & {
  avatar_url: string | null
}

type RelationRow<T> = T | T[] | null

export type ReportReviewListRow = {
  id: string
  target_type: ReportTargetType
  target_id: string
  reason: ReportReason
  description: string | null
  status: ReportStatus
  created_at: string
  reporter: RelationRow<ReportListReporterRow>
}

export type ReportReviewDetailRow = {
  id: string
  target_type: ReportTargetType
  target_id: string
  reason: ReportReason
  description: string | null
  status: ReportStatus
  created_at: string
  updated_at: string | null
  reviewed_at: string | null
  reporter: RelationRow<ReportDetailReporterRow>
}

function firstRelationRow<T>(value: RelationRow<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value
}

function buildListReporter(
  reporter: RelationRow<ReportListReporterRow>
): ReportReviewListItem["reporter"] {
  const row = firstRelationRow(reporter)

  if (!row) {
    return null
  }

  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
  }
}

function buildDetailReporter(
  reporter: RelationRow<ReportDetailReporterRow>
): ReportReviewDetailItem["reporter"] {
  const row = firstRelationRow(reporter)

  if (!row) {
    return null
  }

  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
  }
}

function buildMissingTargetReference(input: {
  type: ReportTargetType
  id: string
}): ReportReviewDetailItem["targetReference"] {
  return {
    type: input.type,
    id: input.id,
    label: null,
    href: null,
    missing: true,
  }
}

export function buildReportReviewListItem(
  row: ReportReviewListRow
): ReportReviewListItem {
  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    reason: row.reason,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    reporter: buildListReporter(row.reporter),
  }
}

export function buildReportReviewDetailItem(
  row: ReportReviewDetailRow
): ReportReviewDetailItem {
  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    reason: row.reason,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reviewedAt: row.reviewed_at,
    reporter: buildDetailReporter(row.reporter),
    targetReference: buildMissingTargetReference({
      type: row.target_type,
      id: row.target_id,
    }),
  }
}
