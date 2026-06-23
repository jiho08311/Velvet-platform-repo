import {
  buildProcessedStoryVideoCreateInput as buildProcessedStoryVideoCreateInputRuntime,
  buildStoryVideoJobFormData as buildStoryVideoJobFormDataRuntime,
  parseStoryVideoJobFormData as parseStoryVideoJobFormDataRuntime,
  StoryPayloadValidationError,
} from "@/modules/story/runtime/story-create-payload"

export const PUBLIC_CONTRACT = true

export { StoryPayloadValidationError }

export type BuildStoryVideoJobFormDataInput = Parameters<
  typeof buildStoryVideoJobFormDataRuntime
>[0]

export type ParseStoryVideoJobFormDataResult = ReturnType<
  typeof parseStoryVideoJobFormDataRuntime
>

export type ProcessedStoryVideoCreateInput = Parameters<
  typeof buildProcessedStoryVideoCreateInputRuntime
>[0]

export function buildStoryVideoJobFormData(
  input: BuildStoryVideoJobFormDataInput
): FormData {
  return buildStoryVideoJobFormDataRuntime(input)
}

export function parseStoryVideoJobFormData(
  formData: FormData
): ParseStoryVideoJobFormDataResult {
  return parseStoryVideoJobFormDataRuntime(formData)
}

export function buildProcessedStoryVideoCreateInput(
  input: ProcessedStoryVideoCreateInput
) {
  return buildProcessedStoryVideoCreateInputRuntime(input)
}
