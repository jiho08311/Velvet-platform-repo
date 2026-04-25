import { buildStoryVideoJobFormData } from "@/modules/story/lib/story-create-payload"
import type { StoryVideoJobPayload } from "@/modules/story/types"
import {
  isCompletedStoryVideoJobPollResponse,
  isFailedStoryVideoJobPollResponse,
  type CompletedStoryVideoJobPollResponse,
  type StoryVideoJobPollResponse,
} from "./story-video-job-contract"

type QueueStoryVideoJobInput = StoryVideoJobPayload & {
  file: File
}

export async function queueStoryVideoJob({
  file,
  ...story
}: QueueStoryVideoJobInput): Promise<StoryVideoJobPollResponse> {
  const formData = buildStoryVideoJobFormData({
    file,
    story,
  })

  const response = await fetch("/api/story/video-job", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error("Failed to queue story video job")
  }

  return (await response.json()) as StoryVideoJobPollResponse
}

export async function waitForStoryVideoJob({
  jobId,
}: {
  jobId: string
}): Promise<CompletedStoryVideoJobPollResponse> {
  const maxAttempts = 60
  const intervalMs = 1000

  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`/api/story/video-job/${jobId}`)

    if (!res.ok) {
      throw new Error("Failed to fetch job status")
    }

    const data = (await res.json()) as StoryVideoJobPollResponse

    if (isCompletedStoryVideoJobPollResponse(data)) {
      return data
    }

    if (isFailedStoryVideoJobPollResponse(data)) {
      throw new Error(data.errorMessage || "Video processing failed")
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error("Video processing timeout")
}
