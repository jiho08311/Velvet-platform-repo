import type { VideoModerationJobMedia } from "@/modules/moderation/contracts/video-moderation-job"

export type VideoModerationOutcome = "approved" | "rejected" | "needs_review"

export type ModerationResultShape = {
  flagged: boolean
  categories?: Record<string, boolean>
  category_scores?: Record<string, number>
}

export type VideoModerationFrameResult = {
  frame: string
  flagged: boolean
  categories?: Record<string, boolean>
  category_scores?: Record<string, number>
}

export type VideoModerationMediaDecision = "approved" | "rejected"

export type VideoModerationMediaResult = {
  mediaId: string
  storagePath: string
  decision: VideoModerationMediaDecision
  summary: Record<string, unknown>
}

export type VideoModerationRuntimeResponse = {
  postId: string
  outcome: VideoModerationOutcome
  finalized: boolean
  processedMediaCount: number
}

export function selectVideoModerationMedia(
  media: VideoModerationJobMedia[]
): VideoModerationJobMedia[] {
  return media.filter(
    (item) => item.type === "video" && item.storagePath.trim().length > 0
  )
}

export function buildVideoModerationRuntimeResponse(input: {
  postId: string
  outcome: VideoModerationOutcome
  finalized: boolean
  processedMediaCount: number
}): VideoModerationRuntimeResponse {
  return {
    postId: input.postId,
    outcome: input.outcome,
    finalized: input.finalized,
    processedMediaCount: input.processedMediaCount,
  }
}
