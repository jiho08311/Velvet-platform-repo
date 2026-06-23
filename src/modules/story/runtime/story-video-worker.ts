import { claimStoryVideoJobForProcessing } from "@/modules/media/public/story-video-worker-job"
import {
  runStoryVideoWorkerRuntime,
  traceStoryVideoWorkerFatalError,
  traceStoryVideoWorkerLoopError,
} from "@/modules/media/public/story-video-worker-runtime"
import { logger } from "@/shared/observability/structured-logger"

const POLL_INTERVAL_MS = Number(process.env.STORY_VIDEO_WORKER_POLL_MS ?? 2000)

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function run() {
  logger.info({
    event: "story_video.worker_ready",
    context: {
      pollIntervalMs: POLL_INTERVAL_MS,
    },
  })

  for (;;) {
    try {
      const claimedJob = await claimStoryVideoJobForProcessing()

      if (!claimedJob) {
        await sleep(POLL_INTERVAL_MS)
        continue
      }

      const result = await runStoryVideoWorkerRuntime(claimedJob.processorInput)

      if (result.status === "completed") {
        logger.info({
          event: "story_video.worker_job_completed",
          context: {
            jobId: result.jobId,
            storyId: result.storyId,
            trimmedStoragePath: result.trimmedStoragePath,
          },
        })
        continue
      }

      logger.error({
        event: "story_video.worker_job_failed",
        context: {
          jobId: result.jobId,
          errorMessage: result.errorMessage,
        },
      })
    } catch (error) {
      traceStoryVideoWorkerLoopError({
        error,
        pollIntervalMs: POLL_INTERVAL_MS,
      })

      logger.error({
        event: "story_video.worker_loop_error",
        error,
      })
      await sleep(POLL_INTERVAL_MS)
    }
  }
}

run().catch((error) => {
  traceStoryVideoWorkerFatalError(error)

  logger.error({
    event: "story_video.worker_fatal_error",
    error,
  })
  process.exit(1)
})
