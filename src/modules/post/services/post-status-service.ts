import {
  buildPostModerationTransitionPayload,
  type PostModerationTransitionPayload,
} from "@/modules/post/policies/post-moderation-policy"

type UpdatePostStatusInput =
  | {
      postId: string
      outcome: "approved"
      publishIntent: "published" | "scheduled"
      publishedAt?: string | null
      clearRejectionReason?: boolean
    }
  | {
      postId: string
      outcome: "rejected"
      rejectionReason?: string | null
    }
  | {
      postId: string
      outcome: "needs_review"
      clearRejectionReason?: boolean
    }
  | {
      postId: string
      outcome: "pending"
      clearRejectionReason?: boolean
    }

type CurrentPostStatus = "draft" | "scheduled" | "published" | "archived" | null

export function shouldSkipPostStatusUpdate({
  outcome,
  currentStatus,
}: {
  outcome: UpdatePostStatusInput["outcome"]
  currentStatus: CurrentPostStatus
}) {
  return outcome === "approved" && currentStatus === "archived"
}

export function buildPostStatusUpdatePayload(
  input: UpdatePostStatusInput
): PostModerationTransitionPayload {
  if (input.outcome === "approved") {
    return buildPostModerationTransitionPayload({
      outcome: "approved",
      publishIntent: input.publishIntent,
      publishedAt: input.publishedAt ?? null,
      clearRejectionReason: input.clearRejectionReason ?? true,
    })
  }

  if (input.outcome === "rejected") {
    return buildPostModerationTransitionPayload({
      outcome: "rejected",
      rejectionReason: input.rejectionReason ?? null,
    })
  }

  if (input.outcome === "needs_review") {
    return buildPostModerationTransitionPayload({
      outcome: "needs_review",
      clearRejectionReason: input.clearRejectionReason ?? true,
    })
  }

  return buildPostModerationTransitionPayload({
    outcome: "pending",
    clearRejectionReason: input.clearRejectionReason ?? true,
  })
}