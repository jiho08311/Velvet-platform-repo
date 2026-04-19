import { updatePostStatus } from "@/modules/post/server/update-post-status"

type VideoModerationPostOutcome =
  | "approved"
  | "rejected"
  | "needs_review"
  | "pending"

type ApplyVideoModerationOutcomeInput = {
  postId: string
  outcome: VideoModerationPostOutcome
  publishIntent?: "published" | "scheduled"
  publishedAt?: string | null
  rejectionReason?: string | null
  clearRejectionReason?: boolean
}

export async function applyVideoModerationOutcome({
  postId,
  outcome,
  publishIntent,
  publishedAt = null,
  rejectionReason,
  clearRejectionReason,
}: ApplyVideoModerationOutcomeInput) {
  if (outcome === "approved") {
    if (!publishIntent) {
      throw new Error("publishIntent is required for approved outcome")
    }

    await updatePostStatus({
      postId,
      outcome: "approved",
      publishIntent,
      publishedAt,
      clearRejectionReason,
    })

    return
  }

  if (outcome === "rejected") {
    await updatePostStatus({
      postId,
      outcome: "rejected",
      rejectionReason,
    })

    return
  }

  if (outcome === "needs_review") {
    await updatePostStatus({
      postId,
      outcome: "needs_review",
      clearRejectionReason,
    })

    return
  }

  await updatePostStatus({
    postId,
    outcome: "pending",
    clearRejectionReason,
  })
}