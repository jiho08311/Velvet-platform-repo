import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { applyVideoModerationOutcome } from "@/modules/moderation/server/apply-video-moderation-outcome"

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
  published_at: string | null
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
    return post.published_at ?? fallbackPublishedAt
  }

  return null
}

export async function finalizeVideoModerationPost({
  postId,
  outcome,
  publishIntent,
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

  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("status, published_at")
    .eq("id", postId)
    .single<PostModerationSourceRow>()

  if (error) {
    throw error
  }

  const resolvedPublishIntent = resolveApprovedPublishIntentFromPost(data)
  const resolvedPublishedAt = resolveApprovedPublishedAtFromPost(
    data,
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