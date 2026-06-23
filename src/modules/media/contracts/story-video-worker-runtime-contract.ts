import type { StoryVideoProcessorInput } from "@/modules/media/contracts/story-video-processor-contract"

export type StoryVideoWorkerRuntimeInput = StoryVideoProcessorInput

export type StoryVideoWorkerRuntimeCompletedResult = {
  jobId: string
  status: "completed"
  storyId: string
  trimmedStoragePath: string
}

export type StoryVideoWorkerRuntimeFailedResult = {
  jobId: string
  status: "failed"
  errorMessage: string
}

export type StoryVideoWorkerRuntimeResult =
  | StoryVideoWorkerRuntimeCompletedResult
  | StoryVideoWorkerRuntimeFailedResult
