import {
  createStoryFromVideoProcessing as createStoryFromVideoProcessingRuntime,
} from "@/modules/story/runtime/create-story"

export const PUBLIC_CONTRACT = true

export type CreateStoryFromVideoProcessingInput = Parameters<
  typeof createStoryFromVideoProcessingRuntime
>[0]
export type CreateStoryFromVideoProcessingResult = Awaited<
  ReturnType<typeof createStoryFromVideoProcessingRuntime>
>

export function createStoryFromVideoProcessing(
  input: CreateStoryFromVideoProcessingInput
): ReturnType<typeof createStoryFromVideoProcessingRuntime> {
  return createStoryFromVideoProcessingRuntime(input)
}
