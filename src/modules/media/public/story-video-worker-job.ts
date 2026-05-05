import {
  claimStoryVideoJobForProcessing as claimStoryVideoJobForProcessingServer,
  completeStoryVideoJobFromProcessorResult as completeStoryVideoJobFromProcessorResultServer,
  markStoryVideoJobFailed as markStoryVideoJobFailedServer,
} from "@/modules/media/server/story-video-job.service"

export async function claimStoryVideoJobForProcessing() {
  return claimStoryVideoJobForProcessingServer()
}

export async function completeStoryVideoJobFromProcessorResult(
  input: Parameters<typeof completeStoryVideoJobFromProcessorResultServer>[0]
) {
  return completeStoryVideoJobFromProcessorResultServer(input)
}

export async function markStoryVideoJobFailed(
  input: Parameters<typeof markStoryVideoJobFailedServer>[0]
) {
  return markStoryVideoJobFailedServer(input)
}
