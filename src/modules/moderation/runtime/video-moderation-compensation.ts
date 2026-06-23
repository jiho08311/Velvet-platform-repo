import { promises as fs } from "fs"
import type { VideoModerationJobMedia } from "@/modules/moderation/contracts/video-moderation-job"
import { applyMediaNeedsReviewForModeration } from "@/modules/media/public/media-moderation-transition"

export async function cleanupVideoModerationTempRoot(tempRoot: string) {
  try {
    await fs.rm(tempRoot, { recursive: true, force: true })
  } catch {}
}

export async function compensateVideoModerationFailure(input: {
  media: VideoModerationJobMedia[]
  error: unknown
}) {
  for (const item of input.media) {
    await applyMediaNeedsReviewForModeration({
      mediaId: item.id,
      summary: {
        provider: "openai",
        decision: "needs_review",
        reason:
          input.error instanceof Error
            ? input.error.message
            : "video moderation failed",
        storagePath: item.storagePath,
      },
    })
  }
}
