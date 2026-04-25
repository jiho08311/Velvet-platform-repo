import {
  claimStoryVideoJobForProcessing,
  completeStoryVideoJobFromProcessorResult,
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
      const claimedJob = await claimStoryVideoJobForProcessing()

      if (!claimedJob) {
        await sleep(POLL_INTERVAL_MS)
        continue
      }

      console.log("🔥 STORY VIDEO WORKER START", {
        jobId: claimedJob.processorInput.jobId,
        creatorId: claimedJob.processorInput.creatorId,
        startTime: claimedJob.processorInput.startTime,
      })

      try {
        const result = await processStoryVideoJob(claimedJob.processorInput)
        const completed = await completeStoryVideoJobFromProcessorResult({
          processorInput: claimedJob.processorInput,
          result,
        })

        console.log("✅ STORY VIDEO WORKER DONE", {
          jobId: result.jobId,
          storyId: completed.storyId,
          trimmedStoragePath: completed.trimmedStoragePath,
        })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Story video processing failed"

        await markStoryVideoJobFailed({
          jobId: claimedJob.processorInput.jobId,
          errorMessage: message,
        })

        console.error("❌ STORY VIDEO WORKER FAILED", {
          jobId: claimedJob.processorInput.jobId,
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
