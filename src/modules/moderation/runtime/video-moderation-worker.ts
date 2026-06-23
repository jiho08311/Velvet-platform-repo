import { Worker } from "bullmq"
import IORedis from "ioredis"
import { withJobCorrelation } from "@/shared/observability/propagate-correlation-id"
import { logger } from "@/shared/observability/structured-logger"
import { runVideoModerationWorkerRuntime } from "@/modules/moderation/runtime/video-moderation-worker-runtime"
import type { VideoModerationJob } from "@/modules/moderation/contracts/video-moderation-job"

const connection = new IORedis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  }
)

const VIDEO_MODERATION_CONCURRENCY = Number(
  process.env.VIDEO_MODERATION_CONCURRENCY ?? 2
)

const VIDEO_MODERATION_WORKER_ID =
  process.env.VIDEO_MODERATION_WORKER_ID ?? "video-moderation-worker"

new Worker(
  "video-moderation",
  async (job) => {
    const payload = job.data as VideoModerationJob
    const correlation = withJobCorrelation(payload.correlation, String(job.id))

    await runVideoModerationWorkerRuntime({
      jobId: String(job.id),
      attemptsMade: job.attemptsMade,
      payload: {
        ...payload,
        correlation,
      },
      worker: {
        workerId: VIDEO_MODERATION_WORKER_ID,
        workerName: "video-moderation-worker",
        concurrency: VIDEO_MODERATION_CONCURRENCY,
      },
    })
  },
  {
    connection,
    concurrency: VIDEO_MODERATION_CONCURRENCY,
  }
)

logger.info({
  event: "video_moderation.worker_ready",
  context: {
    concurrency: VIDEO_MODERATION_CONCURRENCY,
    workerId: VIDEO_MODERATION_WORKER_ID,
  },
})
