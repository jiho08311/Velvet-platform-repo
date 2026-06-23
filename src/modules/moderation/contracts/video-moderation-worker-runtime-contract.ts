import type { VideoModerationJob } from "@/modules/moderation/contracts/video-moderation-job"

export type VideoModerationWorkerRuntimeInput = {
  jobId: string
  attemptsMade: number
  payload: VideoModerationJob
  worker: {
    workerId: string
    workerName: "video-moderation-worker"
    concurrency: number
  }
}

export type VideoModerationWorkerRuntimeRetryMetadata = {
  attempt: number
  maxAttempts: number
  isRetry: boolean
  backoffType: "exponential"
  backoffDelayMs: number
}

export type VideoModerationWorkerRuntimeFailure = {
  errorName: string | null
  errorMessage: string
  errorStack: string | null
  stage: "processVideoModeration"
  retryable: boolean
  fatal: boolean
}

export type VideoModerationWorkerRuntimeResult = {
  jobId: string
  status: "completed"
}

export const VIDEO_MODERATION_WORKER_MAX_ATTEMPTS = 3
export const VIDEO_MODERATION_WORKER_BACKOFF_TYPE = "exponential" as const
export const VIDEO_MODERATION_WORKER_BACKOFF_DELAY_MS = 5000

export function buildVideoModerationWorkerRetryMetadata(
  attemptsMade: number
): VideoModerationWorkerRuntimeRetryMetadata {
  return {
    attempt: attemptsMade,
    maxAttempts: VIDEO_MODERATION_WORKER_MAX_ATTEMPTS,
    isRetry: attemptsMade > 0,
    backoffType: VIDEO_MODERATION_WORKER_BACKOFF_TYPE,
    backoffDelayMs: VIDEO_MODERATION_WORKER_BACKOFF_DELAY_MS,
  }
}

export function buildVideoModerationWorkerFailure(input: {
  attemptsMade: number
  error: unknown
}): VideoModerationWorkerRuntimeFailure {
  const message =
    input.error instanceof Error
      ? input.error.message
      : "video moderation failed"

  const retryable = input.attemptsMade < VIDEO_MODERATION_WORKER_MAX_ATTEMPTS - 1

  return {
    errorName: input.error instanceof Error ? input.error.name : null,
    errorMessage: message,
    errorStack: input.error instanceof Error ? input.error.stack ?? null : null,
    stage: "processVideoModeration",
    retryable,
    fatal: !retryable,
  }
}
