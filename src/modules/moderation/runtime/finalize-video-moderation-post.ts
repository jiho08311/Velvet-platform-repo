import { getPostModerationSource } from "@/modules/post/public/post-moderation-contract"
import { applyVideoModerationOutcome } from "@/modules/moderation/runtime/apply-video-moderation-outcome"
import { InfrastructureError } from "@/shared/errors"
type VideoModerationOutcome = "approved" | "rejected" | "needs_review"

type FinalizeVideoModerationPostInput = {
  postId: string
  outcome: VideoModerationOutcome
  publishIntent: "published" | "scheduled"
  publishedAt?: string | null
  fallbackOutcome?: "needs_review"
}

type PostModerationSourceRow = {
  status: string | null
  publishedAt: string | null
}

function resolveApprovedPublishIntentFromPost(
  post: PostModerationSourceRow
): "published" | "scheduled" {
  if (post.status === "scheduled") {
    return "scheduled"
  }

  return "published"
}

function resolveApprovedPublishedAtFromPost(
  post: PostModerationSourceRow,
  fallbackPublishedAt: string | null
): string | null {
  if (post.status === "scheduled") {
    return post.publishedAt ?? fallbackPublishedAt
  }

  return null
}

export async function finalizeVideoModerationPost({
  postId,
  outcome,
  publishedAt = null,
  fallbackOutcome,
}: FinalizeVideoModerationPostInput) {
  if (outcome === "rejected") {
    await applyVideoModerationOutcome({
      postId,
      outcome: "rejected",
    })
    return
  }

  if (outcome === "needs_review") {
    await applyVideoModerationOutcome({
      postId,
      outcome: "needs_review",
      clearRejectionReason: true,
    })
    return
  }

  if (fallbackOutcome === "needs_review") {
    await applyVideoModerationOutcome({
      postId,
      outcome: "needs_review",
      clearRejectionReason: true,
    })
    return
  }

  const post = await getPostModerationSource(postId)

if (!post) {
  throw new InfrastructureError(
    "POST_MODERATION_SOURCE_NOT_FOUND",
    {
      metadata: {
        postId,
      },
    }
  )
}

  const resolvedPublishIntent = resolveApprovedPublishIntentFromPost(post)
  const resolvedPublishedAt = resolveApprovedPublishedAtFromPost(
    post,
    publishedAt
  )

  await applyVideoModerationOutcome({
    postId,
    outcome: "approved",
    publishIntent: resolvedPublishIntent,
    publishedAt: resolvedPublishedAt,
    clearRejectionReason: true,
  })
}
