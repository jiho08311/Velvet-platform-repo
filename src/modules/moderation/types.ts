export type ModerationId = string

export type ModerationStatus =
  | "pending"
  | "approved"
  | "rejected"

export type ModerationTargetType =
  | "post"
  | "message"
  | "profile"

export type Moderation = {
  id: ModerationId
  targetType: ModerationTargetType
  targetId: string
  status: ModerationStatus
  createdAt: string
}