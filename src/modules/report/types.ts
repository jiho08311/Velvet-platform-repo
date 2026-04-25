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

export function isReportTargetType(value: string): value is ReportTargetType {
  return reportTargetTypes.includes(value as ReportTargetType)
}

export function isReportReason(value: string): value is ReportReason {
  return reportReasons.includes(value as ReportReason)
}

export function isReportStatus(value: string): value is ReportStatus {
  return reportStatuses.includes(value as ReportStatus)
}
