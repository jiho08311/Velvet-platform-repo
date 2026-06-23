import { listPostMedia } from "@/modules/media/public/list-post-media"
import { getMediaModerationDecision } from "@/modules/media/public/media-moderation"

export {
  applyMediaApprovedForModeration as markMediaApprovedForModeration,
  applyMediaNeedsReviewForModeration as markMediaNeedsReviewForModeration,
  applyMediaRejectedForModeration as markMediaRejectedForModeration,
} from "@/modules/media/runtime/apply-media-moderation-transition"

export async function getMediaModerationStatusesByPostId(
  postId: string
): Promise<Array<string | null>> {
  const rows = await listPostMedia({
    postIds: [postId],
    requireReadyAsset: false,
  })

  return Promise.all(
    rows.map(async (item) => {
      const decision = await getMediaModerationDecision({
        mediaId: item.media.id,
      })

      return decision.decision
    })
  )
}