import { promises as fs } from "node:fs"
import { removeTempStoryVideo } from "@/modules/media/services/story-video-storage.service"
import type { StoryVideoProcessorInput } from "@/modules/media/contracts/story-video-processor-contract"
import { createAndTraceSilentFailureEvent } from "@/shared/observability/silent-failure-event"

async function safeCleanupDir(workDir: string) {
  await fs.rm(workDir, { recursive: true, force: true })
}

async function compensateStoryVideoTempStorage(job: StoryVideoProcessorInput) {
  try {
    await removeTempStoryVideo(job.tempStoragePath)
  } catch (error) {
    createAndTraceSilentFailureEvent({
      category: "media_cleanup_swallowed",
      severity: "medium",
      failureMode: "catch_noop",
      provenance: {
        sourceFile:
          "src/modules/media/runtime/story-video-processor-compensation.ts",
        operationName: "compensateStoryVideoTempStorage",
        domain: "media_processing",
        actorType: "worker",
        authorityScope: {
          authority: "media.temp_cleanup",
          resourceType: "story_video_temp_storage",
          resourceId: job.tempStoragePath,
        },
      },
      ignoredExecution: {
        ignored: true,
        mechanism: "catch_noop",
        rejectionObserved: true,
      },
      error,
      metadata: {
        jobId: job.jobId,
        creatorId: job.creatorId,
        tempStoragePath: job.tempStoragePath,
      },
    })
  }
}

export async function compensateStoryVideoProcessorCleanup(input: {
  job: StoryVideoProcessorInput
  workDir: string
}) {
  try {
    await compensateStoryVideoTempStorage(input.job)
  } finally {
    await safeCleanupDir(input.workDir)
  }
}
