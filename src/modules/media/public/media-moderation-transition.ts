import {
  applyMediaModerationTransition as applyMediaModerationTransitionRuntime,
  applyMediaNeedsReviewForModeration as applyMediaNeedsReviewForModerationRuntime,
} from "@/modules/media/runtime/apply-media-moderation-transition"

export const PUBLIC_CONTRACT = true

export type ApplyMediaModerationTransitionInput = Parameters<
  typeof applyMediaModerationTransitionRuntime
>[0]
export type ApplyMediaNeedsReviewForModerationInput = Parameters<
  typeof applyMediaNeedsReviewForModerationRuntime
>[0]

export async function applyMediaModerationTransition(
  input: ApplyMediaModerationTransitionInput
): Promise<void> {
  return applyMediaModerationTransitionRuntime(input)
}

export async function applyMediaNeedsReviewForModeration(
  input: ApplyMediaNeedsReviewForModerationInput
): Promise<void> {
  return applyMediaNeedsReviewForModerationRuntime(input)
}
