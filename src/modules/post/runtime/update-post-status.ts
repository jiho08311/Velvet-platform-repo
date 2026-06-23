import {
  findCurrentCanonicalPostStatusById,
  updateCanonicalPostStatus,
} from "@/modules/post/repositories/post-canonical-write-repository"
import {
  buildPostStatusUpdatePayload,
  shouldSkipPostStatusUpdate,
} from "@/modules/post/services/post-status-service"

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

export async function updatePostStatus(input: UpdatePostStatusInput) {
  const resolvedPostId = input.postId.trim()

  if (!resolvedPostId) {
    throw new Error("postId is required")
  }

  if (input.outcome === "approved") {
    const currentStatus =
      await findCurrentCanonicalPostStatusById(resolvedPostId)

    if (
      shouldSkipPostStatusUpdate({
        outcome: input.outcome,
        currentStatus,
      })
    ) {
      return
    }
  }

  const updatePayload = buildPostStatusUpdatePayload(input)

  await updateCanonicalPostStatus({
    postId: resolvedPostId,
    updateData: updatePayload,
  })
}