import { buildProcessedStoryVideoCreateInput } from "@/modules/story/public/story-create-payload"
import { createStoryFromVideoProcessing } from "@/modules/story/public/create-story-from-video-processing"
import {
  buildCompletedStoryVideoProcessing,
  type StoryVideoProcessorInput,
  type StoryVideoProcessorOutput,
} from "@/modules/media/contracts/story-video-processor-contract"

export async function createFinalStoryFromProcessedVideo(params: {
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

export function buildPersistedStoryVideoCompletion(params: {
  result: StoryVideoProcessorOutput
  storyId: string
}) {
  return buildCompletedStoryVideoProcessing({
    storyId: params.storyId,
    result: params.result,
  })
}
