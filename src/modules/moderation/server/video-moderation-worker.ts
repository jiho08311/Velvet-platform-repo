import { Worker } from "bullmq"
import IORedis from "ioredis"

const connection = new IORedis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  }
)

const VIDEO_MODERATION_CONCURRENCY = Number(
  process.env.VIDEO_MODERATION_CONCURRENCY ?? 2
)

new Worker(
  "video-moderation",
  async (job) => {
    console.log("🔥 WORKER START", {
      jobId: job.id,
      attemptsMade: job.attemptsMade,
      postId: job.data?.postId,
      concurrency: VIDEO_MODERATION_CONCURRENCY,
    })

    const { processVideoModeration } = await import(
      "../../../workflows/process-video-moderation"
    )

    await processVideoModeration(job.data)
  },
  {
    connection,
    concurrency: VIDEO_MODERATION_CONCURRENCY,
  }
)

console.log("✅ video moderation worker ready", {
  concurrency: VIDEO_MODERATION_CONCURRENCY,
})