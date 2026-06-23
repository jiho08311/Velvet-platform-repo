import { videoModerationQueue } from "@/modules/moderation/runtime/video-moderation-queue"
import {
  VIDEO_MODERATION_QUEUE_BACKOFF_DELAY_MS,
  VIDEO_MODERATION_QUEUE_BACKOFF_TYPE,
  VIDEO_MODERATION_QUEUE_MAX_ATTEMPTS,
  VIDEO_MODERATION_QUEUE_PROCESS_NAME,
  VIDEO_MODERATION_QUEUE_REMOVE_ON_COMPLETE,
  VIDEO_MODERATION_QUEUE_REMOVE_ON_FAIL,
  type VideoModerationQueueRuntimeInput,
  type VideoModerationQueueRuntimePayload,
  type VideoModerationQueueRuntimeResult,
} from "@/modules/moderation/contracts/video-moderation-queue-runtime-contract"

import { mergeCorrelationContext } from "@/shared/observability/propagate-correlation-id"



function buildVideoModerationQueuePayload(
  input: VideoModerationQueueRuntimeInput
): VideoModerationQueueRuntimePayload {
  const correlation = mergeCorrelationContext(input.correlation, {
    workflowId: "video-moderation",
    causationId: input.postId,
  })

  return {
    ...input,
    correlation,
  }
}

export async function runVideoModerationQueueRuntime(
  input: VideoModerationQueueRuntimeInput
): Promise<VideoModerationQueueRuntimeResult> {
  const jobPayload = buildVideoModerationQueuePayload(input)

  await videoModerationQueue.add(VIDEO_MODERATION_QUEUE_PROCESS_NAME, jobPayload, {
    attempts: VIDEO_MODERATION_QUEUE_MAX_ATTEMPTS,
    backoff: {
      type: VIDEO_MODERATION_QUEUE_BACKOFF_TYPE,
      delay: VIDEO_MODERATION_QUEUE_BACKOFF_DELAY_MS,
    },
    removeOnComplete: VIDEO_MODERATION_QUEUE_REMOVE_ON_COMPLETE,
    removeOnFail: VIDEO_MODERATION_QUEUE_REMOVE_ON_FAIL,
  })

  return {
    postId: input.postId,
    queued: true,
  }
}
