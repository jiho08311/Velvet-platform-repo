export const moderationQueueStatuses = [
  "pending",
  "reviewed",
  "resolved",
] as const

export type ModerationQueueStatus =
  (typeof moderationQueueStatuses)[number]

export type ModerationQueueStatusTone =
  | "pending"
  | "approved"
  | "processing"

export type ModerationQueueStatusBadge = {
  label: string
  tone: ModerationQueueStatusTone
}

export function isModerationQueueStatus(
  value: string
): value is ModerationQueueStatus {
  return moderationQueueStatuses.includes(
    value as ModerationQueueStatus
  )
}

export function getModerationQueueStatusBadge(
  status: ModerationQueueStatus
): ModerationQueueStatusBadge {
  if (status === "pending") {
    return {
      label: "Pending",
      tone: "pending",
    }
  }

  if (status === "reviewed") {
    return {
      label: "Reviewed",
      tone: "processing",
    }
  }

  return {
    label: "Resolved",
    tone: "approved",
  }
}