import type { VideoModerationJob } from "@/modules/governance/model/video-moderation-job"
import { finalizeVideoModerationPost } from "@/modules/moderation/runtime/finalize-video-moderation-post"
import { resolveVideoModerationOutcome } from "@/modules/moderation/runtime/resolve-video-moderation-outcome"
import { getMediaModerationStatusesByPostId } from "@/modules/media/public/video-moderation-media"
import { applyMediaModerationTransition } from "@/modules/media/public/media-moderation-transition"
import {
  buildVideoModerationRuntimeResponse,
  selectVideoModerationMedia,
  type VideoModerationOutcome,
  type VideoModerationRuntimeResponse,
} from "@/modules/moderation/contracts/video-moderation-runtime-contract"
import { executeVideoModerationBatch } from "@/modules/moderation/runtime/video-moderation-execution-runtime"
import { compensateVideoModerationFailure } from "@/modules/moderation/runtime/video-moderation-compensation"
import { logger } from "@/shared/observability/structured-logger"

function normalizeRuntimeOutcome(
  outcome: "approved" | "rejected" | "needs_review"
): VideoModerationOutcome {
  return outcome
}

async function finalizeVideoModerationRuntime(input: {
  postId: string
  outcome: "approved" | "rejected" | "needs_review"
  publishIntent: VideoModerationJob["publishIntent"]
  publishedAt?: string | null
  fallbackOutcome?: "needs_review"
  processedMediaCount: number
}): Promise<VideoModerationRuntimeResponse> {
  await finalizeVideoModerationPost({
    postId: input.postId,
    outcome: input.outcome,
    publishIntent: input.publishIntent,
    publishedAt: input.publishedAt,
    fallbackOutcome: input.fallbackOutcome,
  })

  return buildVideoModerationRuntimeResponse({
    postId: input.postId,
    outcome: normalizeRuntimeOutcome(input.outcome),
    finalized: true,
    processedMediaCount: input.processedMediaCount,
  })
}

export async function runVideoModerationRuntime({
  postId,
  publishIntent,
  publishedAt = null,
  media,
  correlation,
}: VideoModerationJob): Promise<VideoModerationRuntimeResponse> {
  logger.info({
    event: "video_moderation.runtime_started",
    context: {
      postId,
      media,
      correlationId: correlation?.correlationId ?? null,
      jobId: correlation?.jobId ?? null,
    },
  })

  const videoMedia = selectVideoModerationMedia(media)

  logger.info({
    event: "video_moderation.video_media_filtered",
    context: {
      count: videoMedia.length,
      videoMedia,
    },
  })

  if (videoMedia.length === 0) {
    return finalizeVideoModerationRuntime({
      postId,
      outcome: "approved",
      publishIntent,
      publishedAt,
      processedMediaCount: 0,
    })
  }

  try {
    const results = await executeVideoModerationBatch({
      postId,
      media: videoMedia,
    })

    for (const result of results) {
      await applyMediaModerationTransition({
        mediaId: result.mediaId,
        decision: result.decision,
        summary: result.summary,
      })
    }

    const statuses = await getMediaModerationStatusesByPostId(postId)

    logger.info({
      event: "video_moderation.final_statuses_loaded",
      context: { statuses },
    })

    const outcome = resolveVideoModerationOutcome({ statuses })

    return finalizeVideoModerationRuntime({
      postId,
      outcome,
      publishIntent,
      publishedAt,
      processedMediaCount: results.length,
    })
  } catch (error) {
    logger.error({
      event: "video_moderation.runtime_failed",
      error,
    })

    await compensateVideoModerationFailure({
      media: videoMedia,
      error,
    })

    const statuses = await getMediaModerationStatusesByPostId(postId)
    const outcome = resolveVideoModerationOutcome({ statuses })

    return finalizeVideoModerationRuntime({
      postId,
      outcome,
      publishIntent,
      publishedAt,
      fallbackOutcome: "needs_review",
      processedMediaCount: videoMedia.length,
    })
  }
}
