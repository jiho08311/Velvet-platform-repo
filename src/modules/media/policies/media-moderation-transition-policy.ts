type MediaModerationOutcome = "approved" | "rejected" | "needs_review"

type MediaProcessingStatus = "ready" | "failed"
type MediaStatus = "ready" | "failed"

export type MediaModerationTransitionPayload = {
  status: MediaStatus
  processing_status: MediaProcessingStatus
  moderation_status: MediaModerationOutcome
  moderation_summary: Record<string, unknown>
  moderation_completed_at: string
}

function resolveNow(now?: string): string {
  return now ?? new Date().toISOString()
}

export function buildMediaApprovedModerationPayload(input: {
  summary: Record<string, unknown>
  now?: string
}): MediaModerationTransitionPayload {
  return {
    status: "ready",
    processing_status: "ready",
    moderation_status: "approved",
    moderation_summary: input.summary,
    moderation_completed_at: resolveNow(input.now),
  }
}

export function buildMediaRejectedModerationPayload(input: {
  summary: Record<string, unknown>
  now?: string
}): MediaModerationTransitionPayload {
  return {
    status: "failed",
    processing_status: "failed",
    moderation_status: "rejected",
    moderation_summary: input.summary,
    moderation_completed_at: resolveNow(input.now),
  }
}

export function buildMediaNeedsReviewModerationPayload(input: {
  summary: Record<string, unknown>
  now?: string
}): MediaModerationTransitionPayload {
  return {
    status: "failed",
    processing_status: "failed",
    moderation_status: "needs_review",
    moderation_summary: input.summary,
    moderation_completed_at: resolveNow(input.now),
  }
}
