import type { VideoModerationJob } from "@/modules/moderation/contracts/video-moderation-job"

export type VideoModerationQueueRuntimeInput = VideoModerationJob

export type VideoModerationQueueRuntimePayload = VideoModerationJob

export type VideoModerationQueueRuntimeResult = {
  postId: string
  queued: true
}

export const VIDEO_MODERATION_QUEUE_NAME = "video-moderation"
export const VIDEO_MODERATION_QUEUE_PROCESS_NAME = "process-video"
export const VIDEO_MODERATION_QUEUE_MAX_ATTEMPTS = 3
export const VIDEO_MODERATION_QUEUE_BACKOFF_TYPE = "exponential" as const
export const VIDEO_MODERATION_QUEUE_BACKOFF_DELAY_MS = 5000
export const VIDEO_MODERATION_QUEUE_REMOVE_ON_COMPLETE = 100
export const VIDEO_MODERATION_QUEUE_REMOVE_ON_FAIL = 100
