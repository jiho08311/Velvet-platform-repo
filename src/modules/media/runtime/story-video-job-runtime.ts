import type { StoryVideoJobPayload } from "@/modules/story/types"
import { buildStoryVideoJobPollResponse } from "@/modules/media/contracts/story-video-job-contract"
import type {
  StoryVideoProcessorInput,
  StoryVideoProcessorOutput,
} from "@/modules/media/contracts/story-video-processor-contract"
import {
  removeTempStoryVideo,
  uploadTempStoryVideo,
} from "@/modules/media/services/story-video-storage.service"
import { findCreatorIdByUserId } from "@/modules/media/repositories/story-video-creator-repository"
import type { AuditCorrelationContext } from "@/shared/observability/audit-event-types"
import { createMediaAssetRuntime } from "@/modules/media/runtime/create-media-asset-runtime"
import {
  claimMediaProcessingJobRuntime,
  completeMediaProcessingJobRuntime,
  failMediaProcessingJobRuntime,
  queueMediaProcessingJobRuntime,
} from "@/modules/media/runtime/media-processing-job-runtime"
import { findMediaProcessingJobById } from "@/modules/media/repositories/media-processing-job-repository"
import {
  buildPersistedStoryVideoCompletion,
  createFinalStoryFromProcessedVideo,
} from "@/modules/media/runtime/story-video-job-completion"
import {
  buildStoryVideoProcessorInputPayload,
  mapProcessingJobToStoryVideoJob,
  pickProcessorInputFromProcessingPayload,
} from "@/modules/media/runtime/story-video-job-mappers"
import type {
  ClaimedStoryVideoJob,
  StoryVideoJob,
} from "@/modules/media/runtime/story-video-job-types"

export type { ClaimedStoryVideoJob, StoryVideoJob }

const MEDIA_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media"

async function getCreatorIdByUserId(params: { userId: string }) {
  return findCreatorIdByUserId(params.userId)
}

export async function enqueueStoryVideoJob(params: {
  userId: string
  file: File
  story: StoryVideoJobPayload
  expiresAt: string
  correlation?: AuditCorrelationContext
}): Promise<StoryVideoJob> {
  const creatorId = await getCreatorIdByUserId({
    userId: params.userId,
  })
  const tempPath = await uploadTempStoryVideo({
    creatorId,
    file: params.file,
  })

  try {
    const asset = await createMediaAssetRuntime({
      ownerUserId: params.userId,
      mediaType: "video",
      mimeType: params.file.type || null,
      originalFilename: params.file.name || null,
      fileSizeBytes: params.file.size,
      storageBucket: MEDIA_BUCKET,
      storagePath: tempPath,
      processingStatus: "processing",
      sourceSurface: "story_video_job_new_authority",
    })
    const processorInput = buildStoryVideoProcessorInputPayload({
      creatorId,
      tempStoragePath: tempPath,
      expiresAt: params.expiresAt,
      visibility: params.story.visibility,
      editorState: params.story.editorState,
    })
    const queuedJob = await queueMediaProcessingJobRuntime({
      mediaId: asset.id,
      processorKind: "story_video_trim",
      inputPayload: {
        processorInput,
      },
    })
    const jobRow = await findMediaProcessingJobById(queuedJob.jobId)

    if (!jobRow) {
      throw new Error("Media processing job not found after enqueue")
    }

    return mapProcessingJobToStoryVideoJob(jobRow, {
      ...processorInput,
      jobId: queuedJob.jobId,
    })
  } catch (error) {
    await removeTempStoryVideo(tempPath)
    throw error
  }
}

export async function claimStoryVideoJobForProcessing(): Promise<ClaimedStoryVideoJob | null> {
  const job = await claimMediaProcessingJobRuntime({
    processorKind: "story_video_trim",
    workerId: "story-video-worker",
  })

  if (!job) {
    return null
  }

  return {
    processorInput: {
      ...pickProcessorInputFromProcessingPayload(job.inputPayload),
      jobId: job.jobId,
    },
  }
}

export async function markStoryVideoJobCompleted(params: {
  jobId: string
  storyId: string
  trimmedStoragePath: string
}) {
  const job = await findMediaProcessingJobById(params.jobId)

  if (!job) {
    throw new Error("Media processing job not found")
  }

  await completeMediaProcessingJobRuntime({
    jobId: params.jobId,
    mediaId: job.media_id,
    resultPayload: {
      storyId: params.storyId,
      trimmedStoragePath: params.trimmedStoragePath,
    },
  })
}

export async function markStoryVideoJobFailed(params: {
  jobId: string
  errorMessage: string
}) {
  const job = await findMediaProcessingJobById(params.jobId)

  if (!job) {
    throw new Error("Media processing job not found")
  }

  await failMediaProcessingJobRuntime({
    jobId: params.jobId,
    mediaId: job.media_id,
    errorMessage: params.errorMessage,
  })
}

async function persistCompletedStoryVideoJob(params: {
  result: StoryVideoProcessorOutput
  storyId: string
}) {
  const completed = buildPersistedStoryVideoCompletion({
    storyId: params.storyId,
    result: params.result,
  })

  await markStoryVideoJobCompleted({
    jobId: params.result.jobId,
    storyId: completed.storyId,
    trimmedStoragePath: completed.trimmedStoragePath,
  })

  return completed
}

export async function completeStoryVideoJobFromProcessorResult(params: {
  processorInput: StoryVideoProcessorInput
  result: StoryVideoProcessorOutput
}) {
  const storyId = await createFinalStoryFromProcessedVideo({
    processorInput: params.processorInput,
    result: params.result,
  })

  return persistCompletedStoryVideoJob({
    result: params.result,
    storyId,
  })
}

export async function getStoryVideoJobForUser(params: {
  jobId: string
  userId: string
}) {
  const creatorId = await getCreatorIdByUserId({
    userId: params.userId,
  })
  const job = await findMediaProcessingJobById(params.jobId)

  if (!job) {
    throw new Error("Job not found")
  }

  const processorInput = pickProcessorInputFromProcessingPayload(
    job.input_payload
  )

  if (processorInput.creatorId !== creatorId) {
    throw new Error("Job not found")
  }

  return buildStoryVideoJobPollResponse(
    mapProcessingJobToStoryVideoJob(job, {
      ...processorInput,
      jobId: job.job_id,
    })
  )
}
