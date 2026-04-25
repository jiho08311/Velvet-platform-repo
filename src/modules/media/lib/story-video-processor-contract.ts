import type { StoryCreatePayload, StoryEditorState, StoryVisibility } from "@/modules/story/types"

export type StoryVideoProcessorJobFact = {
  id: string
  creator_id: string
  temp_storage_path: string
  visibility: StoryVisibility
  start_time: number
  expires_at: string
  editor_state: StoryEditorState | null
}

export type StoryVideoProcessorInput = {
  jobId: string
  creatorId: string
  tempStoragePath: string
  startTime: number
  expiresAt: string
  story: StoryCreatePayload
}

export type StoryVideoProcessorOutput = {
  jobId: string
  processedVideoStoragePath: string
  processedVideoContentType: "video/mp4"
}

export type CompletedStoryVideoProcessing = {
  storyId: string
  trimmedStoragePath: string
}

export function buildStoryVideoProcessorInputFromJob(
  job: StoryVideoProcessorJobFact
): StoryVideoProcessorInput {
  return {
    jobId: job.id,
    creatorId: job.creator_id,
    tempStoragePath: job.temp_storage_path,
    startTime: job.start_time,
    expiresAt: job.expires_at,
    story: {
      text: null,
      visibility: job.visibility,
      editorState: job.editor_state,
    },
  }
}

export function buildClaimedStoryVideoJob(job: StoryVideoProcessorJobFact): {
  processorInput: StoryVideoProcessorInput
} {
  return {
    processorInput: buildStoryVideoProcessorInputFromJob(job),
  }
}

export function pickStoryVideoProcessorJobFact(
  job: StoryVideoProcessorJobFact
): StoryVideoProcessorJobFact {
  return {
    id: job.id,
    creator_id: job.creator_id,
    temp_storage_path: job.temp_storage_path,
    visibility: job.visibility,
    start_time: job.start_time,
    expires_at: job.expires_at,
    editor_state: job.editor_state,
  }
}

export function buildCompletedStoryVideoProcessing(params: {
  storyId: string
  result: StoryVideoProcessorOutput
}): CompletedStoryVideoProcessing {
  return {
    storyId: params.storyId,
    trimmedStoragePath: params.result.processedVideoStoragePath,
  }
}

export function buildStoryVideoProcessorOutput(params: {
  input: StoryVideoProcessorInput
  processedVideoStoragePath: string
}): StoryVideoProcessorOutput {
  return {
    jobId: params.input.jobId,
    processedVideoStoragePath: params.processedVideoStoragePath,
    processedVideoContentType: "video/mp4",
  }
}
