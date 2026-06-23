// src/modules/media/public/media-moderation.ts

import {
  getMediaModerationDecisionRuntime,
  queueMediaModerationRuntime,
  recordMediaModerationResultRuntime,
} from "@/modules/media/runtime/media-moderation-runtime"

export const PUBLIC_CONTRACT = true

export type QueueMediaModerationInput = Parameters<
  typeof queueMediaModerationRuntime
>[0]
export type RecordMediaModerationResultInput = Parameters<
  typeof recordMediaModerationResultRuntime
>[0]
export type GetMediaModerationDecisionInput = Parameters<
  typeof getMediaModerationDecisionRuntime
>[0]
export type MediaModerationDecisionContract = Awaited<
  ReturnType<typeof getMediaModerationDecisionRuntime>
>

export function queueMediaModeration(
  input: QueueMediaModerationInput
) {
  return queueMediaModerationRuntime(input)
}

export function recordMediaModerationResult(
  input: RecordMediaModerationResultInput
) {
  return recordMediaModerationResultRuntime(input)
}

export function getMediaModerationDecision(
  input: GetMediaModerationDecisionInput
): Promise<MediaModerationDecisionContract> {
  return getMediaModerationDecisionRuntime(input)
}
