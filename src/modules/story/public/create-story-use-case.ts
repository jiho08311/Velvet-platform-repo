import { createStory as createStoryRuntime } from "@/modules/story/runtime/create-story"

export {
  normalizeStoryCreatePayload,
  parseStoryCreateRequestBody,
  StoryPayloadValidationError,
} from "@/modules/story/runtime/story-create-payload"

export const PUBLIC_CONTRACT = true

export type CreateStoryInput = Parameters<typeof createStoryRuntime>[0]
export type CreateStoryResult = Awaited<ReturnType<typeof createStoryRuntime>>

export function createStory(
  input: CreateStoryInput
): ReturnType<typeof createStoryRuntime> {
  return createStoryRuntime(input)
}
