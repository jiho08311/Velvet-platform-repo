"use server"

import {
  getMediaModerationStatusesByPostId as getMediaModerationStatusesByPostIdUseCase,
  markMediaApprovedForModeration as markMediaApprovedForModerationUseCase,
  markMediaNeedsReviewForModeration as markMediaNeedsReviewForModerationUseCase,
  markMediaRejectedForModeration as markMediaRejectedForModerationUseCase,
} from "@/modules/media/use-cases/video-moderation-media"

export async function markMediaApprovedForModeration(
  mediaId: string,
  summary: Record<string, unknown>
) {
  return markMediaApprovedForModerationUseCase(mediaId, summary)
}

export async function markMediaRejectedForModeration(
  mediaId: string,
  summary: Record<string, unknown>
) {
  return markMediaRejectedForModerationUseCase(mediaId, summary)
}

export async function markMediaNeedsReviewForModeration(
  mediaId: string,
  summary: Record<string, unknown>
) {
  return markMediaNeedsReviewForModerationUseCase(mediaId, summary)
}

export async function getMediaModerationStatusesByPostId(postId: string) {
  return getMediaModerationStatusesByPostIdUseCase(postId)
}
