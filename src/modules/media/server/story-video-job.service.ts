import { createClient } from "@supabase/supabase-js"
import type {
  StoryEditorState,
  StoryVideoJobPayload,
  StoryVisibility,
} from "@/modules/story/types"
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
  type StoryVideoJobStatus,
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

export type StoryVideoJob = {
  id: string
  creator_id: string
  temp_storage_path: string
  trimmed_storage_path: string | null
  story_id: string | null
  visibility: StoryVisibility
  start_time: number
  expires_at: string
  editor_state: StoryEditorState | null
  status: StoryVideoJobStatus
  attempts: number
  error_message: string | null
  locked_at: string | null
  created_at: string
  updated_at: string
}

export type ClaimedStoryVideoJob = {
  processorInput: StoryVideoProcessorInput
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables")
}

function createAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

async function getCreatorIdByUserId(params: { userId: string }) {
  const admin = createAdminClient()

  const { data: creator, error: creatorError } = await admin
    .from("creators")
    .select("id")
    .eq("user_id", params.userId)
    .single()

  if (creatorError || !creator) {
    throw new Error("Creator not found")
  }

  return creator.id
}

async function insertStoryVideoJob(params: {
  creatorId: string
  tempStoragePath: string
  story: StoryVideoJobPayload
  expiresAt: string
}) {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from("story_video_jobs")
    .insert(
      buildStoryVideoJobInsertValues({
        creatorId: params.creatorId,
        tempStoragePath: params.tempStoragePath,
        story: params.story,
        expiresAt: params.expiresAt,
      })
    )
    .select("*")
    .single()

  if (error || !data) {
    throw new Error(error?.message || "Failed to create job")
  }

  return data as StoryVideoJob
}

async function claimStoryVideoJobRow() {
  const admin = createAdminClient()

  const { data, error } = await admin.rpc("claim_story_video_job")

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return null
  }

  return data as StoryVideoJob
}

async function updateStoryVideoJobCompleted(params: {
  jobId: string
  storyId: string
  trimmedStoragePath: string
}) {
  const admin = createAdminClient()

  const { error } = await admin
    .from("story_video_jobs")
    .update(
      buildCompletedStoryVideoJobValues({
        storyId: params.storyId,
        trimmedStoragePath: params.trimmedStoragePath,
      })
    )
    .eq("id", params.jobId)

  if (error) {
    throw new Error(error.message)
  }
}

async function updateStoryVideoJobFailed(params: {
  jobId: string
  errorMessage: string
}) {
  const admin = createAdminClient()

  const { error } = await admin
    .from("story_video_jobs")
    .update(
      buildFailedStoryVideoJobValues({
        errorMessage: params.errorMessage,
      })
    )
    .eq("id", params.jobId)

  if (error) {
    throw new Error(error.message)
  }
}

async function getStoryVideoJobPollRowForCreator(params: {
  jobId: string
  creatorId: string
}) {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from("story_video_jobs")
    .select(STORY_VIDEO_JOB_POLL_SELECT)
    .eq("id", params.jobId)
    .eq("creator_id", params.creatorId)
    .single()

  if (error || !data) {
    throw new Error("Job not found")
  }

  return pickStoryVideoJobPollRow(data)
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
