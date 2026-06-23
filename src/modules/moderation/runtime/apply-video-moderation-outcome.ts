import { recordOperationalAudit } from "@/modules/governance/public/audit-contract"
import { updatePostStatus } from "@/modules/post/public/update-post-status"

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
  actorId?: string | null
}

function auditActionForOutcome(outcome: VideoModerationPostOutcome): string {
  if (outcome === "approved") return "content_restored"
  if (outcome === "rejected") return "content_removed"
  if (outcome === "needs_review") return "review_completed"
  return "review_completed"
}

export async function applyVideoModerationOutcome({
  postId,
  outcome,
  publishIntent,
  publishedAt = null,
  rejectionReason,
  clearRejectionReason,
  actorId = null,
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
  } else if (outcome === "rejected") {
    await updatePostStatus({
      postId,
      outcome: "rejected",
      rejectionReason,
    })
  } else if (outcome === "needs_review") {
    await updatePostStatus({
      postId,
      outcome: "needs_review",
      clearRejectionReason,
    })
  } else {
    await updatePostStatus({
      postId,
      outcome: "pending",
      clearRejectionReason,
    })
  }

  await recordOperationalAudit({
    actorId,
    action: auditActionForOutcome(outcome),
    targetType: "post",
    targetId: postId,
    metadata: {
      outcome,
      publishIntent: publishIntent ?? null,
      publishedAt,
      rejectionReason: rejectionReason ?? null,
      clearRejectionReason: clearRejectionReason ?? null,
      source: "moderation.applyVideoModerationOutcome",
    },
  })
}