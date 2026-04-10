import {
  claimStoryVideoJob,
  markStoryVideoJobCompleted,
  markStoryVideoJobFailed,
} from "@/modules/media/server/story-video-job.service"
import { processStoryVideoJob } from "@/modules/media/server/story-video-processor.server"

const POLL_INTERVAL_MS = Number(process.env.STORY_VIDEO_WORKER_POLL_MS ?? 2000)

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function run() {
  console.log("✅ story video worker ready", {
    pollIntervalMs: POLL_INTERVAL_MS,
  })

  for (;;) {
    try {
      const job = await claimStoryVideoJob()

      if (!job || !job.id) {
        await sleep(POLL_INTERVAL_MS)
        continue
      }

      console.log("🔥 STORY VIDEO WORKER START", {
        jobId: job.id,
        creatorId: job.creator_id,
        startTime: job.start_time,
        status: job.status,
      })

      try {
        const result = await processStoryVideoJob(job)

        await markStoryVideoJobCompleted({
          jobId: job.id,
          storyId: result.storyId,
          trimmedStoragePath: result.finalStoragePath,
        })

        console.log("✅ STORY VIDEO WORKER DONE", {
          jobId: job.id,
          storyId: result.storyId,
          trimmedStoragePath: result.finalStoragePath,
        })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Story video processing failed"

        await markStoryVideoJobFailed({
          jobId: job.id,
          errorMessage: message,
        })

        console.error("❌ STORY VIDEO WORKER FAILED", {
          jobId: job.id,
          error: message,
        })
      }
    } catch (error) {
      console.error("❌ STORY VIDEO WORKER LOOP ERROR", error)
      await sleep(POLL_INTERVAL_MS)
    }
  }
}

run().catch((error) => {
  console.error("❌ story video worker fatal", error)
  process.exit(1)
})