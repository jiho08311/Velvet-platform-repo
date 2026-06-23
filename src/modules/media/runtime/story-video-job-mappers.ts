import type { StoryVideoProcessorInput } from "@/modules/media/contracts/story-video-processor-contract"
import type { MediaProcessingJobRow } from "@/modules/media/repositories/media-processing-job-repository"
import type { StoryVideoJob } from "@/modules/media/runtime/story-video-job-types"

export function pickProcessorInputFromProcessingPayload(
  payload: Record<string, unknown>
): StoryVideoProcessorInput {
  const processorInput = payload.processorInput

  if (!processorInput || typeof processorInput !== "object") {
    throw new Error("Invalid media processing job payload")
  }

  const input = processorInput as Partial<StoryVideoProcessorInput>

  if (
    typeof input.creatorId !== "string" ||
    typeof input.tempStoragePath !== "string" ||
    typeof input.expiresAt !== "string" ||
    !input.story
  ) {
    throw new Error("Invalid story video processor input")
  }

  return {
    jobId: typeof input.jobId === "string" ? input.jobId : "",
    creatorId: input.creatorId,
    tempStoragePath: input.tempStoragePath,
    startTime: typeof input.startTime === "number" ? input.startTime : 0,
    expiresAt: input.expiresAt,
    story: input.story,
  }
}

export function mapProcessingJobToStoryVideoJob(
  job: MediaProcessingJobRow,
  processorInput: StoryVideoProcessorInput
): StoryVideoJob {
  const resultPayload =
    job.result_payload && typeof job.result_payload === "object"
      ? job.result_payload
      : {}

  const storyId =
    typeof resultPayload.storyId === "string" ? resultPayload.storyId : null

  const trimmedStoragePath =
    typeof resultPayload.trimmedStoragePath === "string"
      ? resultPayload.trimmedStoragePath
      : null

  const errorMessage =
    typeof resultPayload.errorMessage === "string"
      ? resultPayload.errorMessage
      : null

  return {
    id: job.job_id,
    creator_id: processorInput.creatorId,
    temp_storage_path: processorInput.tempStoragePath,
    trimmed_storage_path: trimmedStoragePath,
    story_id: storyId,
    visibility: processorInput.story.visibility,
    start_time: processorInput.startTime,
    expires_at: processorInput.expiresAt,
    editor_state: processorInput.story.editorState ?? null,
    status: job.status,
    attempts: 0,
    error_message: errorMessage,
    locked_at: job.claimed_at,
    created_at: job.created_at,
    updated_at: job.completed_at ?? job.claimed_at ?? job.created_at,
  }
}

export function buildStoryVideoProcessorInputPayload(input: {
  jobId?: string
  creatorId: string
  tempStoragePath: string
  expiresAt: string
  visibility: StoryVideoProcessorInput["story"]["visibility"]
  editorState: StoryVideoProcessorInput["story"]["editorState"]
}): StoryVideoProcessorInput {
  return {
    jobId: input.jobId ?? "",
    creatorId: input.creatorId,
    tempStoragePath: input.tempStoragePath,
    startTime: 0,
    expiresAt: input.expiresAt,
    story: {
      text: null,
      visibility: input.visibility,
      editorState: input.editorState,
    },
  }
}
