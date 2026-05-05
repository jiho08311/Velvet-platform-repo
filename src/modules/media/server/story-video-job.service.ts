import type { StoryVideoJobPayload } from "@/modules/story/types"
import {
  buildProcessedStoryVideoCreateInput,
  buildStoryVideoJobInsertValues,
} from "@/modules/story/lib/story-create-payload"
import { createStoryFromVideoProcessing } from "@/modules/story/server/create-story"
import {
  buildCompletedStoryVideoJobValues,
  buildFailedStoryVideoJobValues,
  buildStoryVideoJobPollResponse,
  pickStoryVideoJobPollRow,
  STORY_VIDEO_JOB_POLL_SELECT,
} from "@/modules/media/lib/story-video-job-contract"
import {
  buildClaimedStoryVideoJob,
  buildCompletedStoryVideoProcessing,
  pickStoryVideoProcessorJobFact,
  type StoryVideoProcessorInput,
  type StoryVideoProcessorOutput,
} from "@/modules/media/lib/story-video-processor-contract"
import {
  removeTempStoryVideo,
  uploadTempStoryVideo,
} from "@/modules/media/server/story-video-storage.service"
import { findCreatorIdByUserId } from "@/modules/media/repositories/story-video-creator-repository"
import {
  claimStoryVideoJobRow,
  findStoryVideoJobPollRowForCreator,
  insertStoryVideoJobRow,
  updateStoryVideoJobCompletedRow,
  updateStoryVideoJobFailedRow,
  type StoryVideoJobRow,
} from "@/modules/media/repositories/story-video-job-repository"

export type StoryVideoJob = StoryVideoJobRow

export type ClaimedStoryVideoJob = {
  processorInput: StoryVideoProcessorInput
}

async function getCreatorIdByUserId(params: { userId: string }) {
  return findCreatorIdByUserId(params.userId)
}

async function insertStoryVideoJob(params: {
  creatorId: string
  tempStoragePath: string
  story: StoryVideoJobPayload
  expiresAt: string
}) {
  return insertStoryVideoJobRow(
    buildStoryVideoJobInsertValues({
      creatorId: params.creatorId,
      tempStoragePath: params.tempStoragePath,
      story: params.story,
      expiresAt: params.expiresAt,
    })
  )
}

async function updateStoryVideoJobCompleted(params: {
  jobId: string
  storyId: string
  trimmedStoragePath: string
}) {
  return updateStoryVideoJobCompletedRow({
    jobId: params.jobId,
    values: buildCompletedStoryVideoJobValues({
      storyId: params.storyId,
      trimmedStoragePath: params.trimmedStoragePath,
    }),
  })
}

async function updateStoryVideoJobFailed(params: {
  jobId: string
  errorMessage: string
}) {
  return updateStoryVideoJobFailedRow({
    jobId: params.jobId,
    values: buildFailedStoryVideoJobValues({
      errorMessage: params.errorMessage,
    }),
  })
}

async function getStoryVideoJobPollRowForCreator(params: {
  jobId: string
  creatorId: string
}) {
  const job = await findStoryVideoJobPollRowForCreator({
    jobId: params.jobId,
    creatorId: params.creatorId,
    selectColumns: STORY_VIDEO_JOB_POLL_SELECT,
  })

  return pickStoryVideoJobPollRow(job)
}

async function createFinalStoryFromProcessedVideo(params: {
  processorInput: StoryVideoProcessorInput
  result: StoryVideoProcessorOutput
}) {
  const storyCreationInput = buildProcessedStoryVideoCreateInput({
    creatorId: params.processorInput.creatorId,
    processedVideoStoragePath: params.result.processedVideoStoragePath,
    story: params.processorInput.story,
    expiresAt: params.processorInput.expiresAt,
  })

  return createStoryFromVideoProcessing(storyCreationInput)
}

async function persistCompletedStoryVideoJob(params: {
  result: StoryVideoProcessorOutput
  storyId: string
}) {
  const completed = buildCompletedStoryVideoProcessing({
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

export async function enqueueStoryVideoJob(params: {
  userId: string
  file: File
  story: StoryVideoJobPayload
  expiresAt: string
}) {
  const creatorId = await getCreatorIdByUserId({
    userId: params.userId,
  })
  const tempPath = await uploadTempStoryVideo({
    creatorId,
    file: params.file,
  })

  try {
    return await insertStoryVideoJob({
      creatorId,
      tempStoragePath: tempPath,
      story: params.story,
      expiresAt: params.expiresAt,
    })
  } catch (error) {
    await removeTempStoryVideo(tempPath)
    throw error
  }
}

export async function claimStoryVideoJob() {
  return claimStoryVideoJobRow()
}

export async function claimStoryVideoJobForProcessing(): Promise<ClaimedStoryVideoJob | null> {
  const job = await claimStoryVideoJob()

  if (!job) {
    return null
  }

  const processorJob = pickStoryVideoProcessorJobFact(job)
  return buildClaimedStoryVideoJob(processorJob)
}

export async function markStoryVideoJobCompleted(params: {
  jobId: string
  storyId: string
  trimmedStoragePath: string
}) {
  return updateStoryVideoJobCompleted(params)
}

export async function markStoryVideoJobFailed(params: {
  jobId: string
  errorMessage: string
}) {
  return updateStoryVideoJobFailed(params)
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
  const job = await getStoryVideoJobPollRowForCreator({
    jobId: params.jobId,
    creatorId,
  })

  return buildStoryVideoJobPollResponse(job)
}
