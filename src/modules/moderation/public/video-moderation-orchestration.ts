import {
  applyVideoModerationOutcome as applyVideoModerationOutcomeRuntime,
} from "@/modules/moderation/runtime/apply-video-moderation-outcome"
import {
  enqueueVideoModeration as enqueueVideoModerationRuntime,
} from "@/modules/moderation/runtime/enqueue-video-moderation"
import {
  runVideoModerationRuntime as runVideoModeration,
} from "@/modules/moderation/runtime/video-moderation-runtime"

export const PUBLIC_CONTRACT = true

export type EnqueueVideoModerationInput = Parameters<
  typeof enqueueVideoModerationRuntime
>[0]
export type ApplyVideoModerationOutcomeInput = Parameters<
  typeof applyVideoModerationOutcomeRuntime
>[0]
export type RunVideoModerationRuntimeInput = Parameters<
  typeof runVideoModeration
>[0]

export function enqueueVideoModeration(
  input: EnqueueVideoModerationInput
): ReturnType<typeof enqueueVideoModerationRuntime> {
  return enqueueVideoModerationRuntime(input)
}

export function applyVideoModerationOutcome(
  input: ApplyVideoModerationOutcomeInput
): ReturnType<typeof applyVideoModerationOutcomeRuntime> {
  return applyVideoModerationOutcomeRuntime(input)
}

export function runVideoModerationRuntime(
  input: RunVideoModerationRuntimeInput
): ReturnType<typeof runVideoModeration> {
  return runVideoModeration(input)
}
