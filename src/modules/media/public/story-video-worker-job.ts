import {
  claimStoryVideoJobForProcessing as claimStoryVideoJobForProcessingServer,
  completeStoryVideoJobFromProcessorResult as completeStoryVideoJobFromProcessorResultServer,
  markStoryVideoJobFailed as markStoryVideoJobFailedServer,
} from "@/modules/media/services/story-video-job.service"

export const PUBLIC_CONTRACT = true

export type ClaimedStoryVideoJob = Awaited<
  ReturnType<typeof claimStoryVideoJobForProcessingServer>
>
export type CompleteStoryVideoJobFromProcessorResultInput = Parameters<
  typeof completeStoryVideoJobFromProcessorResultServer
>[0]
export type CompleteStoryVideoJobFromProcessorResult = Awaited<
  ReturnType<typeof completeStoryVideoJobFromProcessorResultServer>
>
export type MarkStoryVideoJobFailedInput = Parameters<
  typeof markStoryVideoJobFailedServer
>[0]

export async function claimStoryVideoJobForProcessing(): Promise<ClaimedStoryVideoJob> {
  return claimStoryVideoJobForProcessingServer()
}

export async function completeStoryVideoJobFromProcessorResult(
  input: CompleteStoryVideoJobFromProcessorResultInput
): Promise<CompleteStoryVideoJobFromProcessorResult> {
  return completeStoryVideoJobFromProcessorResultServer(input)
}

export async function markStoryVideoJobFailed(
  input: MarkStoryVideoJobFailedInput
): Promise<void> {
  return markStoryVideoJobFailedServer(input)
}
