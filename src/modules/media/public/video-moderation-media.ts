import {
  getMediaModerationStatusesByPostId as getMediaModerationStatusesByPost,
  markMediaApprovedForModeration as markMediaApproved,
  markMediaNeedsReviewForModeration as markMediaNeedsReview,
  markMediaRejectedForModeration as markMediaRejected,
} from "@/modules/media/use-cases/video-moderation-media"

export const PUBLIC_CONTRACT = true

export type GetMediaModerationStatusesByPostIdInput = Parameters<
  typeof getMediaModerationStatusesByPost
>[0]
export type GetMediaModerationStatusesByPostIdResult = Awaited<
  ReturnType<typeof getMediaModerationStatusesByPost>
>
export type MarkMediaApprovedForModerationInput = Parameters<
  typeof markMediaApproved
>[0]
export type MarkMediaNeedsReviewForModerationInput = Parameters<
  typeof markMediaNeedsReview
>[0]
export type MarkMediaRejectedForModerationInput = Parameters<
  typeof markMediaRejected
>[0]

export async function getMediaModerationStatusesByPostId(
  input: GetMediaModerationStatusesByPostIdInput
): Promise<GetMediaModerationStatusesByPostIdResult> {
  return getMediaModerationStatusesByPost(input)
}

export async function markMediaApprovedForModeration(
  input: MarkMediaApprovedForModerationInput
): Promise<void> {
  return markMediaApproved(input)
}

export async function markMediaNeedsReviewForModeration(
  input: MarkMediaNeedsReviewForModerationInput
): Promise<void> {
  return markMediaNeedsReview(input)
}

export async function markMediaRejectedForModeration(
  input: MarkMediaRejectedForModerationInput
): Promise<void> {
  return markMediaRejected(input)
}
