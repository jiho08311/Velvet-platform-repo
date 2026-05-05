import {
  findMediaModerationStatusesByPostId,
  markMediaApprovedForModeration as markMediaApprovedForModerationInRepository,
  markMediaNeedsReviewForModeration as markMediaNeedsReviewForModerationInRepository,
  markMediaRejectedForModeration as markMediaRejectedForModerationInRepository,
} from "@/modules/media/repositories/media-moderation-repository"

export async function markMediaApprovedForModeration(
  mediaId: string,
  summary: Record<string, unknown>
) {
  return markMediaApprovedForModerationInRepository(mediaId, summary)
}

export async function markMediaRejectedForModeration(
  mediaId: string,
  summary: Record<string, unknown>
) {
  return markMediaRejectedForModerationInRepository(mediaId, summary)
}

export async function markMediaNeedsReviewForModeration(
  mediaId: string,
  summary: Record<string, unknown>
) {
  return markMediaNeedsReviewForModerationInRepository(mediaId, summary)
}

export async function getMediaModerationStatusesByPostId(
  postId: string
): Promise<Array<string | null>> {
  return findMediaModerationStatusesByPostId(postId)
}
