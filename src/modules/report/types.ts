export type ReportId = string

export type ReportReason =
  | "spam"
  | "abuse"
  | "other"

export type ReportTargetType =
  | "creator"
  | "post"
  | "message"
  | "comment"

export type Report = {
  id: ReportId
  reporterUserId: string
  targetType: ReportTargetType
  targetId: string
  reason: ReportReason
  createdAt: string
}