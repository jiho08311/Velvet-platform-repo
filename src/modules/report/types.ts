export type ReportId = string

export const reportReasons = [
  "spam",
  "harassment",
  "nudity",
  "violence",
  "hate",
  "impersonation",
  "scam",
  "other",
] as const

export type ReportReason = (typeof reportReasons)[number]

export const reportTargetTypes = [
  "creator",
  "post",
  "message",
  "comment",
  "user",
] as const

export type ReportTargetType = (typeof reportTargetTypes)[number]

export const reportStatuses = [
  "pending",
  "reviewing",
  "resolved",
  "rejected",
] as const

export type ReportStatus = (typeof reportStatuses)[number]

export type ReportCreationPayload = {
  targetType: ReportTargetType
  targetId: string
  reason: ReportReason
  description?: string
}

export type ReportTriggerPayload = Pick<
  ReportCreationPayload,
  "targetType" | "targetId"
> & {
  pathname: string
}

export type Report = {
  id: ReportId
  reporterUserId: string
  targetType: ReportTargetType
  targetId: string
  reason: ReportReason
  createdAt: string
}

export type ReportReviewListItem = {
  id: ReportId
  targetType: ReportTargetType
  targetId: string
  reason: ReportReason
  description: string | null
  status: ReportStatus
  createdAt: string
  reporter: {
    id: string
    email: string | null
    username: string | null
    displayName: string | null
  } | null
}


export type ReportReviewDetailItem = {
  id: ReportId
  targetType: ReportTargetType
  targetId: string
  reason: ReportReason
  description: string | null
  status: ReportStatus
  createdAt: string
  updatedAt: string | null
  reviewedAt: string | null
  reporter: {
    id: string
    email: string | null
    username: string | null
    displayName: string | null
    avatarUrl: string | null
  } | null
  targetReference: {
    type: ReportTargetType
    id: string
    label: string | null
    href: string | null
    missing: boolean
  }
}

export function isReportTargetType(value: string): value is ReportTargetType {
  return reportTargetTypes.includes(value as ReportTargetType)
}

export function isReportReason(value: string): value is ReportReason {
  return reportReasons.includes(value as ReportReason)
}

export function isReportStatus(value: string): value is ReportStatus {
  return reportStatuses.includes(value as ReportStatus)
}
